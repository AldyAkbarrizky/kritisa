import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteMahasiswaAction } from "@/app/actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { FormSubmit } from "@/components/form-submit";
import { ImportMahasiswaButton } from "@/components/import-mahasiswa";
import { ButtonLink, Card, EmptyState, SuccessBanner } from "@/components/ui";
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <SuccessBanner
            message={saved ? "Perubahan data mahasiswa berhasil." : null}
          />
          <ImportMahasiswaButton />
        </div>
        <ButtonLink href="/dosen/mahasiswa/tambah">+ Tambah</ButtonLink>
      </div>
      {users.length > 0 ? (
        <div className="grid gap-4">
          {users.map((u) => (
            <Card key={u.id} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    {u.name}
                  </h2>
                  <p className="text-sm text-muted">{u.email}</p>
                  <p className="text-sm text-muted">
                    {u.programStudy || "-"} · {u.university || "-"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/dosen/mahasiswa/${u.id}/edit`}
                    className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-surface-muted"
                  >
                    Edit
                  </Link>
                  <form action={deleteMahasiswaAction}>
                    <input type="hidden" name="id" value={u.id} />
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
          title="Belum ada mahasiswa terdaftar."
          action={
            <ButtonLink href="/dosen/mahasiswa/tambah">
              Tambah Mahasiswa
            </ButtonLink>
          }
        />
      )}
    </DashboardShell>
  );
}
