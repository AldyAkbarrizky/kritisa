import type { Metadata } from "next";
import { createMahasiswaAction } from "@/app/actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { FormSubmit } from "@/components/form-submit";
import { Card, ErrorBanner, Field, inputClassName } from "@/components/ui";
import { requireAuth } from "@/lib/auth";
import { firstSearchValue } from "@/lib/utils";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Tambah Mahasiswa" };

export default async function CreateMahasiswaPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  if (!(await requireAuth("dosen"))) notFound();
  const query = await searchParams;

  return (
    <DashboardShell title="Tambah Mahasiswa" description="Buat akun baru untuk mahasiswa.">
      <Card>
        <form action={createMahasiswaAction} className="space-y-4">
          <ErrorBanner message={firstSearchValue(query.error)} />
          <Field label="Email" name="email"><input id="email" name="email" type="email" className={inputClassName} required /></Field>
          <Field label="Nama Lengkap" name="name"><input id="name" name="name" className={inputClassName} required /></Field>
          <Field label="Kata Sandi" name="password"><input id="password" name="password" type="password" className={inputClassName} required minLength={6} /></Field>
          <Field label="Program Studi" name="programStudy"><input id="programStudy" name="programStudy" className={inputClassName} /></Field>
          <Field label="Universitas" name="university"><input id="university" name="university" className={inputClassName} /></Field>
          <FormSubmit>Tambah Mahasiswa</FormSubmit>
        </form>
      </Card>
    </DashboardShell>
  );
}
