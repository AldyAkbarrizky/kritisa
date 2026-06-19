import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { ImportMahasiswaButton } from "@/components/import-mahasiswa";
import { MahasiswaTable } from "@/components/mahasiswa-table";
import { ButtonLink, SuccessBanner } from "@/components/ui";
import { requireAuth } from "@/lib/auth";
import { listUsers } from "@/lib/storage";
import { firstSearchValue } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Kelola Mahasiswa" };

export default async function MahasiswaPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  if (!(await requireAuth("dosen"))) notFound();
  const query = await searchParams;
  const users = await listUsers("mahasiswa");
  const saved = firstSearchValue(query.saved) === "1";

  return (
    <DashboardShell
      title="Kelola Mahasiswa"
      description="Tambah, edit, hapus, atau import mahasiswa dari Excel."
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <SuccessBanner
            message={saved ? "Perubahan data mahasiswa berhasil." : null}
          />
          <ImportMahasiswaButton />
        </div>
        <ButtonLink href="/dosen/mahasiswa/tambah">+ Tambah</ButtonLink>
      </div>
      <MahasiswaTable users={users} />
    </DashboardShell>
  );
}
