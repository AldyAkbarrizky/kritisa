import type { Metadata } from "next";
import { StudentHeader } from "@/components/student-header";
import { ButtonLink, Card, PageIntro } from "@/components/ui";
import { getCurrentStudent } from "@/lib/session";
import { getStoryBySlug } from "@/lib/storage";
import { firstSearchValue } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Selesai",
};

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

  return (
    <div className="min-h-screen bg-background">
      <StudentHeader />
      <main className="mx-auto w-full max-w-xl space-y-6 px-4 py-8 sm:px-6 sm:py-12">
        <PageIntro
          eyebrow="Selesai"
          title="Terima kasih"
          description="Jawaban dan refleksimu telah tersimpan. Kamu dapat kembali ke katalog untuk membaca cerpen lainnya."
        />
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
