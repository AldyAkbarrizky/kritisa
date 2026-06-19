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
import { generateReflectionPrompt } from "@/lib/ai/client";
import { selectReflectionPrompt } from "@/lib/reflection";
import { getCurrentUser } from "@/lib/auth";
import {
  getLatestAnnotation,
  getLatestReflection,
  getStoryBySlug,
} from "@/lib/storage";
import { firstSearchValue } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Refleksi Membaca" };

export default async function ReflectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [{ slug }, query, user] = await Promise.all([
    params,
    searchParams,
    getCurrentUser(),
  ]);
  const story = await getStoryBySlug(slug);
  if (!story) notFound();

  const annotation = user ? await getLatestAnnotation(user.id, story.id) : null;
  const reflection = user ? await getLatestReflection(user.id, story.id) : null;

  let prompt: string;
  if (user && annotation) {
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
        {!user ? (
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
                defaultValue={reflection?.answerText ?? ""}
                required
                minLength={20}
                maxLength={3000}
              />
            </Field>
            <FormSubmit pendingLabel="Mengirim refleksi...">
              Kirim Refleksi
            </FormSubmit>
          </form>
        </Card>
      </main>
    </div>
  );
}
