import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard-shell";
import { CerpenTable } from "@/components/cerpen-table";
import {
  ButtonLink,
  EmptyState,
  ErrorBanner,
  SuccessBanner,
} from "@/components/ui";
import { requireAuth } from "@/lib/auth";
import { listStories } from "@/lib/storage";
import { firstSearchValue } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kelola Cerpen",
};

export default async function LecturerStoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  if (!(await requireAuth("dosen"))) notFound();
  const query = await searchParams;
  const stories = await listStories({ status: "all" });
  const error = firstSearchValue(query.error);
  const saved = firstSearchValue(query.saved) === "1";

  return (
    <DashboardShell
      title="Kelola Cerpen"
      description="Tambah, edit, publish, unpublish, atau arsipkan cerpen."
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <ErrorBanner message={error} />
          <SuccessBanner
            message={saved ? "Perubahan cerpen berhasil diproses." : null}
          />
        </div>
        <ButtonLink href="/dosen/cerpen/tambah">Tambah Cerpen</ButtonLink>
      </div>

      {stories.length > 0 ? (
        <CerpenTable stories={stories} />
      ) : (
        <EmptyState
          title="Belum ada cerpen."
          action={
            <ButtonLink href="/dosen/cerpen/tambah">Tambah Cerpen</ButtonLink>
          }
        />
      )}
    </DashboardShell>
  );
}
