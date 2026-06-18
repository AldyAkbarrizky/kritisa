import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { selectQuoteAction } from "@/app/actions";
import { FormSubmit } from "@/components/form-submit";
import { StudentHeader } from "@/components/student-header";
import {
  Badge,
  ButtonLink,
  Card,
  ErrorBanner,
  PageIntro,
  SuccessBanner,
} from "@/components/ui";
import { getCurrentStudent } from "@/lib/session";
import { getStoryBySlug } from "@/lib/storage";
import { firstSearchValue, formatDate, formatMonth } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const story = await getStoryBySlug(slug);

  return {
    title: story?.title ?? "Cerpen",
  };
}

export default async function StoryDetailPage({
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
  const error = firstSearchValue(query.error);

  if (!story) {
    notFound();
  }

  const paragraphs = story.content.split(/\n{2,}/).filter(Boolean);

  return (
    <div className="min-h-screen bg-background">
      <StudentHeader />
      <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-12">
        <ErrorBanner message={error} />

        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          {story.coverImageUrl ? (
            <div
              role="img"
              aria-label={story.title}
              className="aspect-[3/1] w-full bg-cover bg-center"
              style={{ backgroundImage: `url("${story.coverImageUrl}")` }}
            />
          ) : (
            <div className="flex aspect-[3/1] w-full items-center justify-center bg-primary/8">
              <span className="font-serif text-6xl font-bold leading-none text-primary/25">
                {story.title.charAt(0)}
              </span>
            </div>
          )}
        </div>

        {!student ? (
          <Card className="space-y-4">
            <p className="text-sm leading-6 text-muted">
              Masuk sebagai mahasiswa agar kritik, diskusi, dan refleksimu
              tersimpan.
            </p>
            <ButtonLink
              href={`/masuk?next=${encodeURIComponent(`/cerpen/${story.slug}`)}`}
              fullWidth
            >
              Masuk sebagai Mahasiswa
            </ButtonLink>
          </Card>
        ) : null}

        <article className="space-y-8">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge tone="primary">{story.mediaSource.name}</Badge>
              <Badge tone="accent">{formatMonth(story.publicationMonth)}</Badge>
            </div>
            <PageIntro
              title={story.title}
              description={`${story.author || "Penulis tidak disebutkan"} · ${formatDate(story.publishedAt)}`}
            />
            <p className="rounded-lg border-l-4 border-accent bg-accent-soft px-4 py-3 text-sm leading-6 text-foreground">
              Sumber: {story.mediaSource.name} —{" "}
              {formatMonth(story.publicationMonth)}
              {story.sourceUrl ? (
                <>
                  {" "}
                  ·{" "}
                  <a
                    href={story.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-accent-strong underline underline-offset-4"
                  >
                    tautan sumber
                  </a>
                </>
              ) : null}
            </p>
          </div>

          <div className="reading-body text-[18px] leading-[1.78] text-foreground">
            {paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </article>

        <Card className="space-y-4">
          <h2 className="text-lg font-bold text-foreground">
            Langkah Berikutnya
          </h2>
          <p className="text-sm leading-6 text-muted">
            Ambil satu kutipan dari cerpen ini, tulis kritikmu, lalu lanjutkan
            diskusi atau refleksi.
          </p>
          <form action={selectQuoteAction}>
            <input type="hidden" name="slug" value={story.slug} />
            <FormSubmit pendingLabel="Mengambil kutipan...">
              Ambil Kutipan Acak
            </FormSubmit>
          </form>
          <div className="grid gap-3 sm:grid-cols-2">
            <ButtonLink
              href={`/cerpen/${story.slug}/diskusi`}
              variant="secondary"
              fullWidth
            >
              Diskusikan dengan AI
            </ButtonLink>
            <ButtonLink
              href={`/cerpen/${story.slug}/refleksi`}
              variant="secondary"
              fullWidth
            >
              Lanjut ke Refleksi
            </ButtonLink>
          </div>
        </Card>
        <SuccessBanner
          message={student ? `Identitas aktif: ${student.name}` : null}
        />
      </main>
    </div>
  );
}
