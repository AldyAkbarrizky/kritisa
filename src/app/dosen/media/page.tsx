import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { deleteMediaSourceAction } from "@/app/actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { FormSubmit } from "@/components/form-submit";
import { ButtonLink, Card, EmptyState, SuccessBanner } from "@/components/ui";
import { requireAuth } from "@/lib/auth";
import { getMediaSources } from "@/lib/storage";
import { firstSearchValue } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Kelola Media" };

export default async function MediaSourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  if (!(await requireAuth("dosen"))) notFound();
  const query = await searchParams;
  const sources = await getMediaSources();
  const saved = firstSearchValue(query.saved) === "1";

  return (
    <DashboardShell
      title="Kelola Media Sumber"
      description="Tambah, edit, atau hapus media sumber cerpen."
    >
      <div className="flex items-center justify-between">
        <SuccessBanner
          message={saved ? "Perubahan media berhasil diproses." : null}
        />
        <ButtonLink href="/dosen/media/tambah">Tambah Media</ButtonLink>
      </div>
      {sources.length > 0 ? (
        <div className="grid gap-4">
          {sources.map((s) => (
            <Card key={s.id} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    {s.name}
                  </h2>
                  <p className="text-sm text-muted">{s.slug}</p>
                  {s.websiteUrl ? (
                    <a
                      href={s.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-primary underline underline-offset-4"
                    >
                      {s.websiteUrl}
                    </a>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/dosen/media/${s.id}/edit`}
                    className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-surface-muted"
                  >
                    Edit
                  </Link>
                  <form action={deleteMediaSourceAction}>
                    <input type="hidden" name="id" value={s.id} />
                    <FormSubmit
                      variant="danger"
                      fullWidth={false}
                      pendingLabel="Menghapus..."
                    >
                      Hapus
                    </FormSubmit>
                  </form>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Belum ada media sumber."
          action={
            <ButtonLink href="/dosen/media/tambah">Tambah Media</ButtonLink>
          }
        />
      )}
    </DashboardShell>
  );
}
