import type { Metadata } from "next";
import { StudentHeader } from "@/components/student-header";
import { StoryCard } from "@/components/story-card";
import {
  ButtonLink,
  EmptyState,
  Field,
  PageIntro,
  inputClassName,
} from "@/components/ui";
import {
  getMediaSources,
  listPublicationMonths,
  listStories,
} from "@/lib/storage";
import { firstSearchValue, formatMonth } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Katalog Cerpen",
};

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const query = await searchParams;
  const media = firstSearchValue(query.media) ?? "";
  const month = firstSearchValue(query.month) ?? "";
  const search = firstSearchValue(query.search) ?? "";
  const [stories, mediaSources, months] = await Promise.all([
    listStories({ media, month, search }),
    getMediaSources(),
    listPublicationMonths(),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <StudentHeader />
      <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 sm:px-6 sm:py-12">
        <PageIntro
          eyebrow="Katalog"
          title="Katalog Cerpen"
          description="Telusuri cerpen berdasarkan media sumber atau bulan terbit."
        />

        <form
          className="rounded-lg border border-border bg-surface p-4 shadow-sm"
          action="/cerpen"
        >
          <div className="grid gap-4 md:grid-cols-[1fr_180px_180px_auto] md:items-end">
            <Field label="Cari" name="search">
              <input
                id="search"
                name="search"
                className={inputClassName}
                defaultValue={search}
                placeholder="Cari judul atau penulis cerpen..."
              />
            </Field>
            <Field label="Media" name="media">
              <select
                id="media"
                name="media"
                className={inputClassName}
                defaultValue={media}
              >
                <option value="">Semua</option>
                {mediaSources.map((source) => (
                  <option key={source.id} value={source.slug}>
                    {source.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Bulan Terbit" name="month">
              <select
                id="month"
                name="month"
                className={inputClassName}
                defaultValue={month}
              >
                <option value="">Semua</option>
                {months.map((item) => (
                  <option key={item} value={item}>
                    {formatMonth(item)}
                  </option>
                ))}
              </select>
            </Field>
            <button className="min-h-11 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">
              Terapkan
            </button>
          </div>
        </form>

        {stories.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2">
            {stories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Belum ada cerpen yang dipublikasikan."
            description="Coba ubah filter atau kembali lagi setelah dosen menambahkan cerpen."
            action={
              <ButtonLink href="/cerpen" variant="secondary">
                Reset Filter
              </ButtonLink>
            }
          />
        )}
      </main>
    </div>
  );
}
