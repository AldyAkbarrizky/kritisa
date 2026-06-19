import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard-shell";
import { JawabanTable } from "@/components/jawaban-table";
import { ButtonLink, EmptyState, inputClassName } from "@/components/ui";
import { requireAuth } from "@/lib/auth";
import { getMediaSources, listAnswerRows, listStories } from "@/lib/storage";
import { firstSearchValue } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Jawaban Mahasiswa",
};

export default async function AnswersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  if (!(await requireAuth("dosen"))) notFound();
  const query = await searchParams;
  const storyId = firstSearchValue(query.storyId) ?? "";
  const mediaSourceId = firstSearchValue(query.mediaSourceId) ?? "";
  const [stories, mediaSources, rows] = await Promise.all([
    listStories({ status: "all" }),
    getMediaSources(),
    listAnswerRows({
      storyId: storyId || undefined,
      mediaSourceId: mediaSourceId || undefined,
    }),
  ]);

  const exportParams = new URLSearchParams();
  if (storyId) exportParams.set("storyId", storyId);
  if (mediaSourceId) exportParams.set("mediaSourceId", mediaSourceId);
  const exportHref = `/api/admin/export${exportParams.size ? `?${exportParams.toString()}` : ""}`;

  return (
    <DashboardShell
      title="Jawaban Mahasiswa"
      description="Lihat kritik, refleksi, dan unduh jawaban dalam format CSV."
    >
      <form
        className="rounded-lg border border-border bg-surface p-4 shadow-sm"
        action="/dosen/jawaban"
      >
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
          <div>
            <label className="mb-1 block text-sm font-semibold text-foreground">
              Filter Cerpen
            </label>
            <select
              name="storyId"
              className={inputClassName}
              defaultValue={storyId}
            >
              <option value="">Semua cerpen</option>
              {stories.map((story) => (
                <option key={story.id} value={story.id}>
                  {story.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-foreground">
              Filter Media
            </label>
            <select
              name="mediaSourceId"
              className={inputClassName}
              defaultValue={mediaSourceId}
            >
              <option value="">Semua media</option>
              {mediaSources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.name}
                </option>
              ))}
            </select>
          </div>
          <button className="min-h-11 cursor-pointer rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-accent-strong">
            Terapkan
          </button>
          <ButtonLink href={exportHref} variant="secondary">
            Download CSV
          </ButtonLink>
        </div>
      </form>

      {rows.length === 0 ? (
        <EmptyState title="Belum ada jawaban mahasiswa." />
      ) : (
        <JawabanTable rows={rows} />
      )}
    </DashboardShell>
  );
}
