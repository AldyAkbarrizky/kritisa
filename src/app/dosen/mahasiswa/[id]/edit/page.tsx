import type { Metadata } from "next";
import { updateMahasiswaAction } from "@/app/actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { FormSubmit } from "@/components/form-submit";
import { Card, ErrorBanner, Field, inputClassName } from "@/components/ui";
import { requireAuth } from "@/lib/auth";
import { getUserById } from "@/lib/storage";
import { firstSearchValue } from "@/lib/utils";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Edit Mahasiswa" };

export default async function EditMahasiswaPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  if (!(await requireAuth("dosen"))) notFound();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const user = await getUserById(id);
  if (!user) notFound();

  return (
    <DashboardShell title="Edit Mahasiswa" description="Perbarui data mahasiswa.">
      <Card>
        <form action={updateMahasiswaAction} className="space-y-4">
          <input type="hidden" name="id" value={user.id} />
          <ErrorBanner message={firstSearchValue(query.error)} />
          <Field label="Email" name="email"><input id="email" name="email" className={inputClassName} defaultValue={user.email} disabled /></Field>
          <Field label="Nama Lengkap" name="name"><input id="name" name="name" className={inputClassName} defaultValue={user.name} required /></Field>
          <Field label="Program Studi" name="programStudy"><input id="programStudy" name="programStudy" className={inputClassName} defaultValue={user.programStudy} /></Field>
          <Field label="Universitas" name="university"><input id="university" name="university" className={inputClassName} defaultValue={user.university} /></Field>
          <FormSubmit>Simpan Perubahan</FormSubmit>
        </form>
      </Card>
    </DashboardShell>
  );
}
