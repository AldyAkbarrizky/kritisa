import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { MediaTable } from "@/components/media-table";
import { ButtonLink, EmptyState, SuccessBanner } from "@/components/ui";
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SuccessBanner
          message={saved ? "Perubahan media berhasil diproses." : null}
        />
        <ButtonLink href="/dosen/media/tambah" className="sm:ml-auto">
          Tambah Media
        </ButtonLink>
      </div>
      {sources.length > 0 ? (
        <MediaTable sources={sources} />
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
