import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { saveReflectionAction } from "@/app/actions";
import { FormSubmit } from "@/components/form-submit";
import { StudentHeader } from "@/components/student-header";
import {
  ButtonLink,
  Card,
  EmptyState,
  ErrorBanner,
  Field,
  PageIntro,
  SuccessBanner,
  textareaClassName,
} from "@/components/ui";
import {
  generateReflectionDraft,
  generateReflectionPrompt,
} from "@/lib/ai/client";
import { isAiGuardReply } from "@/lib/ai/guardrails";
import { selectReflectionPrompt } from "@/lib/reflection";
import { getCurrentStudent } from "@/lib/session";
import {
  getLatestAiConversationMessages,
  getLatestAnnotation,
  getLatestReflection,
  getStoryBySlug,
} from "@/lib/storage";
import type {
  AiMessage,
  Annotation,
  Reflection,
  StoryWithMedia,
} from "@/lib/types";
import { firstSearchValue } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Refleksi Membaca",
};

function getRelevantStudentMessages(messages: AiMessage[]) {
  return messages
    .map((message, index) => ({
      message,
      nextMessage: messages[index + 1],
    }))
    .filter(({ message, nextMessage }) => {
      if (message.role !== "student") {
        return false;
      }

      return !nextMessage || !isAiGuardReply(nextMessage.content);
    })
    .map(({ message }) => message.content);
}

function buildFallbackReflectionDraft(input: {
  story: StoryWithMedia;
  annotation?: Annotation | null;
  studentMessages: string[];
}) {
  const discussionFocus = input.studentMessages
    .slice(-3)
    .map((message) => message.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("; ");

  return `Dalam diskusi tentang cerpen "${input.story.title}", saya mulai melihat bahwa bagian yang saya bahas perlu dikaitkan dengan bukti dari teks. ${input.annotation ? `Anotasi saya tentang kutipan tersebut membantu saya menandai persoalan utama yang perlu dijelaskan lebih hati-hati. ` : ""}Pertanyaan yang muncul dalam diskusi adalah: ${discussionFocus}. Dari sini, saya perlu menyusun refleksi dengan lebih jelas agar pendapat saya tidak hanya berupa kesan, tetapi juga didukung alasan dan bagian cerita yang relevan.`;
}

export default async function ReflectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [{ slug }, query, student] = await Promise.all([
    params,
    searchParams,
    getCurrentStudent(),
  ]);
  const story = await getStoryBySlug(slug);

  if (!story) {
    notFound();
  }

  const [annotation, reflection, discussionMessages]: [
    Annotation | null,
    Reflection | null,
    AiMessage[],
  ] = student
    ? await Promise.all([
        getLatestAnnotation(student.id, story.id),
        getLatestReflection(student.id, story.id),
        getLatestAiConversationMessages(student.id, story.id),
      ])
    : [null, null, []];

  let prompt: string;
  if (student && annotation) {
    const aiPrompt = await generateReflectionPrompt({
      story,
      quoteText: annotation.quoteText,
      annotationText: annotation.critiqueText,
    });
    prompt = aiPrompt.ok
      ? aiPrompt.content
      : selectReflectionPrompt(`${story.slug}${annotation.quoteText ?? ""}`);
  } else {
    prompt = selectReflectionPrompt(
      `${story.slug}${annotation?.quoteText ?? ""}`,
    );
  }

  const relevantStudentMessages = getRelevantStudentMessages(discussionMessages);
  let draftAnswer = "";

  if (student && !reflection && relevantStudentMessages.length > 0) {
    const aiDraft = await generateReflectionDraft({
      story,
      quoteText: annotation?.quoteText,
      annotationText: annotation?.critiqueText,
      studentMessages: relevantStudentMessages,
    });
    draftAnswer = aiDraft.ok
      ? aiDraft.content
      : buildFallbackReflectionDraft({
          story,
          annotation,
          studentMessages: relevantStudentMessages,
        });
  }

  const error = firstSearchValue(query.error);

  return (
    <div className="min-h-screen bg-background">
      <StudentHeader />
      <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-12">
        <PageIntro
          eyebrow={story.title}
          title="Refleksi Membaca"
          description="Tuliskan apa yang Anda pahami, pertanyakan, atau pelajari setelah membaca cerpen ini."
        />

        {!student ? (
          <EmptyState
            title="Identitas belum diisi"
            description="Masuk sebagai mahasiswa sebelum mengirim refleksi."
            action={
              <ButtonLink
                href={`/masuk?next=${encodeURIComponent(`/cerpen/${story.slug}/refleksi`)}`}
                fullWidth
              >
                Masuk sebagai Mahasiswa
              </ButtonLink>
            }
          />
        ) : null}

        <Card className="space-y-4 border-l-4 border-l-primary">
          <h2 className="text-lg font-bold text-foreground">
            Pertanyaan Refleksi
          </h2>
          <p className="text-base leading-7 text-foreground">{prompt}</p>
        </Card>

        <Card>
          <form action={saveReflectionAction} className="space-y-4">
            <input type="hidden" name="slug" value={story.slug} />
            <input type="hidden" name="promptText" value={prompt} />
            <ErrorBanner message={error} />
            <SuccessBanner
              message={reflection ? "Refleksi Anda berhasil disimpan." : null}
            />
            <Field label="Jawaban Refleksi" name="answerText">
              <textarea
                id="answerText"
                name="answerText"
                className={textareaClassName}
                placeholder="Tuliskan refleksi Anda di sini..."
                defaultValue={reflection?.answerText ?? draftAnswer}
                required
                minLength={20}
                maxLength={3000}
              />
            </Field>
            {draftAnswer && !reflection ? (
              <p className="text-xs leading-5 text-muted">
                Teks awal di atas dibuat otomatis dari input diskusi Anda dengan AI.
                Baca ulang, ubah, dan lengkapi sebelum dikirim.
              </p>
            ) : null}
            <FormSubmit pendingLabel="Mengirim refleksi...">
              Kirim Refleksi
            </FormSubmit>
          </form>
        </Card>
      </main>
    </div>
  );
}
