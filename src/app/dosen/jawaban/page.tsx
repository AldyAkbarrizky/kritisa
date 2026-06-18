import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard-shell";
import {
  Badge,
  ButtonLink,
  EmptyState,
  Field,
  inputClassName,
} from "@/components/ui";
import { requireAdminSession } from "@/lib/session";
import { getMediaSources, listAnswerRows, listStories } from "@/lib/storage";
import type { AnswerRow } from "@/lib/types";
import {
  firstSearchValue,
  formatDateTime,
  formatMonth,
  perspectiveLabel,
  truncate,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Jawaban Mahasiswa",
};

export default async function AnswersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireAdminSession();
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
          <Field label="Filter Cerpen" name="storyId">
            <select
              id="storyId"
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
          </Field>
          <Field label="Filter Media" name="mediaSourceId">
            <select
              id="mediaSourceId"
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
          </Field>
          <button className="min-h-11 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">
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
        <>
          {/* Mobile Cards */}
          <div className="grid gap-4 md:hidden">
            {rows.map((row) => (
              <DetailsCard key={row.session.id} row={row} />
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden overflow-hidden rounded-lg border border-border bg-surface shadow-sm md:block">
            <div className="max-w-full overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-surface-muted text-xs uppercase text-muted">
                  <tr>
                    <th className="px-4 py-3">Mahasiswa</th>
                    <th className="px-4 py-3">Cerpen</th>
                    <th className="px-4 py-3">Kutipan</th>
                    <th className="px-4 py-3">Kritik</th>
                    <th className="px-4 py-3">Refleksi</th>
                    <th className="px-4 py-3">Waktu</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.session.id}
                      className="border-t border-border align-top"
                    >
                      <td className="px-4 py-3">
                        <strong className="block text-foreground">
                          {row.student.name}
                        </strong>
                        <span className="text-muted">
                          {row.student.programStudy} · {row.student.university}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <strong className="block text-foreground">
                          {row.story.title}
                        </strong>
                        <span className="text-muted">
                          {row.story.mediaSource.name}
                        </span>
                      </td>
                      <td className="max-w-xs px-4 py-3 text-muted">
                        {truncate(row.annotation?.quoteText ?? "", 120)}
                      </td>
                      <td className="max-w-xs px-4 py-3 text-muted">
                        {truncate(row.annotation?.critiqueText ?? "", 160)}
                      </td>
                      <td className="max-w-xs px-4 py-3 text-muted">
                        {truncate(row.reflection?.answerText ?? "", 160)}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {formatDateTime(row.latestAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </DashboardShell>
  );
}

/* ── Mobile: expandable detail card ── */

function DetailsCard({ row }: { row: AnswerRow }) {
  return (
    <details className="group rounded-lg border border-border bg-surface shadow-sm">
      <summary className="cursor-pointer px-4 py-3 transition hover:bg-surface-muted">
        <div className="flex flex-wrap gap-2">
          <Badge tone="primary">{row.story.mediaSource.name}</Badge>
          <Badge tone="accent">{formatMonth(row.story.publicationMonth)}</Badge>
          {row.annotation ? (
            <Badge tone="success">
              {perspectiveLabel(row.annotation.perspective)}
            </Badge>
          ) : null}
        </div>
        <div className="mt-2">
          <h2 className="font-bold text-foreground">{row.student.name}</h2>
          <p className="text-sm text-muted">
            {row.student.programStudy} · {row.student.university}
          </p>
        </div>
        <p className="mt-1 text-sm font-semibold text-foreground">
          {row.story.title}
        </p>
        <p className="mt-1 text-xs text-muted">
          {formatDateTime(row.latestAt)} — klik untuk detail
        </p>
      </summary>

      <div className="space-y-4 border-t border-border px-4 py-4">
        {row.annotation?.quoteText ? (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-muted">
              Kutipan
            </h3>
            <blockquote className="mt-1 rounded-lg border-l-4 border-accent bg-accent-soft px-3 py-2 text-sm leading-6 text-foreground">
              {row.annotation.quoteText}
            </blockquote>
          </div>
        ) : null}

        {row.annotation?.critiqueText ? (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-muted">
              Kritik · {perspectiveLabel(row.annotation.perspective)}
            </h3>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-foreground">
              {row.annotation.critiqueText}
            </p>
          </div>
        ) : null}

        {row.reflection?.promptText ? (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-muted">
              Pertanyaan Refleksi
            </h3>
            <p className="mt-1 text-sm leading-6 text-foreground">
              {row.reflection.promptText}
            </p>
          </div>
        ) : null}

        {row.reflection?.answerText ? (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-muted">
              Jawaban Refleksi
            </h3>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-foreground">
              {row.reflection.answerText}
            </p>
          </div>
        ) : null}

        {row.aiMessageCount > 0 ? (
          <p className="text-xs text-muted">
            💬 {row.aiMessageCount} pesan diskusi AI
          </p>
        ) : null}
      </div>
    </details>
  );
}
