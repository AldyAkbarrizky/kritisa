import type { Metadata } from "next";
import { StudentHeader } from "@/components/student-header";
import { ButtonLink, Card, PageIntro } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getLatestReflection, getStoryBySlug } from "@/lib/storage";
import { firstSearchValue } from "@/lib/utils";
import { generateReflectionSummary } from "@/lib/ai/client";
import { RingkasanPemahaman } from "@/components/ringkasan-pemahaman";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Selesai" };

export default async function CompletionPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [query, user] = await Promise.all([searchParams, getCurrentUser()]);
  const slug = firstSearchValue(query.story) ?? "";
  const story = slug ? await getStoryBySlug(slug) : null;

  let ringkasan: string | null = null;
  if (user && story) {
    const reflection = await getLatestReflection(user.id, story.id);
    if (reflection?.answerText) {
      const result = await generateReflectionSummary({
        story,
        reflectionAnswer: reflection.answerText,
      });
      if (result.ok) ringkasan = result.content;
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <StudentHeader />
      <main className="mx-auto w-full max-w-xl space-y-6 px-4 py-8 sm:px-6 sm:py-12">
        <PageIntro
          eyebrow="Selesai"
          title="Terima kasih"
          description="Jawaban dan refleksi Anda telah tersimpan. Anda dapat kembali ke katalog untuk membaca cerpen lainnya."
        />
        {ringkasan ? <RingkasanPemahaman content={ringkasan} /> : null}
        <Card className="space-y-4">
          {user ? (
            <p className="text-sm leading-6 text-muted">
              Identitas:{" "}
              <strong className="text-foreground">{user.name}</strong>,{" "}
              {user.programStudy}, {user.university}
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
