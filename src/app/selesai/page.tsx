import type { Metadata } from "next";
import { StudentHeader } from "@/components/student-header";
import { ButtonLink, Card, PageIntro } from "@/components/ui";
import { getCurrentStudent } from "@/lib/session";
import {
  getLatestAnnotation,
  getLatestReflection,
  getStoryBySlug,
} from "@/lib/storage";
import { firstSearchValue, truncate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Selesai",
};

function compactAnswer(value: string | undefined, length = 150) {
  return truncate((value ?? "").replace(/\s+/g, " ").trim(), length);
}

function buildUnderstandingSummary({
  storyTitle,
  critiqueText,
  reflectionText,
}: {
  storyTitle: string;
  critiqueText?: string;
  reflectionText?: string;
}) {
  const critique = compactAnswer(critiqueText, 150);
  const reflection = compactAnswer(reflectionText, 170);

  if (!critique && !reflection) {
    return "";
  }

  if (critique && reflection) {
    return `Berdasarkan jawaban Anda, tampak bahwa Anda memahami cerpen "${storyTitle}" melalui persoalan yang Anda kritisi dalam anotasi. Anda menyoroti ${critique} serta menghubungkannya dengan refleksi bahwa ${reflection}. Pemahaman ini menunjukkan kemampuan Anda dalam menafsirkan makna cerita dan merefleksikannya dalam konteks yang lebih luas.`;
  }

  if (reflection) {
    return `Berdasarkan refleksi Anda, tampak bahwa Anda memahami cerpen "${storyTitle}" melalui gagasan bahwa ${reflection}. Pemahaman ini menunjukkan kemampuan Anda dalam menafsirkan makna cerita dan menghubungkannya dengan pengalaman atau konteks yang lebih luas.`;
  }

  return `Berdasarkan kritik Anda, tampak bahwa Anda mulai membaca cerpen "${storyTitle}" secara analitis melalui persoalan ${critique}. Catatan ini menunjukkan upaya Anda dalam menafsirkan kutipan dan menemukan bagian cerita yang perlu dipikirkan lebih kritis.`;
}

export default async function CompletionPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [query, student] = await Promise.all([
    searchParams,
    getCurrentStudent(),
  ]);
  const slug = firstSearchValue(query.story) ?? "";
  const story = slug ? await getStoryBySlug(slug) : null;
  const [annotation, reflection] =
    student && story
      ? await Promise.all([
          getLatestAnnotation(student.id, story.id),
          getLatestReflection(student.id, story.id),
        ])
      : [null, null];
  const understandingSummary = story
    ? buildUnderstandingSummary({
        storyTitle: story.title,
        critiqueText: annotation?.critiqueText,
        reflectionText: reflection?.answerText,
      })
    : "";

  return (
    <div className="min-h-screen bg-background">
      <StudentHeader />
      <main className="mx-auto w-full max-w-xl space-y-6 px-4 py-8 sm:px-6 sm:py-12">
        <PageIntro
          eyebrow="Selesai"
          title="Terima kasih"
          description="Jawaban dan refleksi Anda telah tersimpan. Anda dapat kembali ke katalog untuk membaca cerpen lainnya."
        />
        {understandingSummary ? (
          <Card className="space-y-3 border-l-4 border-l-primary">
            <h2 className="text-lg font-bold text-foreground">
              Ringkasan Pemahaman Anda
            </h2>
            <p className="text-sm leading-7 text-foreground">
              {understandingSummary}
            </p>
          </Card>
        ) : null}
        <Card className="space-y-4">
          {student ? (
            <p className="text-sm leading-6 text-muted">
              Identitas:{" "}
              <strong className="text-foreground">{student.name}</strong>,{" "}
              {student.programStudy}, {student.university}
            </p>
          ) : null}
          {story ? (
            <p className="text-sm leading-6 text-muted">
              Cerpen: <strong className="text-foreground">{story.title}</strong>
            </p>
          ) : null}
          <ButtonLink href="/cerpen" fullWidth>
            Kembali ke Katalog
          </ButtonLink>
        </Card>
      </main>
    </div>
  );
}
