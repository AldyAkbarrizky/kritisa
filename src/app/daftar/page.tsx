import type { Metadata } from "next";
import Link from "next/link";
import { registerAction } from "@/app/actions";
import { FormSubmit } from "@/components/form-submit";
import { StudentHeader } from "@/components/student-header";
import { Card, ErrorBanner, Field, PageIntro, inputClassName } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { firstSearchValue } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Daftar" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const [query, user] = await Promise.all([searchParams, getCurrentUser()]);
  if (user) redirect("/cerpen");
  const error = firstSearchValue(query.error);

  return (
    <div className="min-h-screen bg-background">
      <StudentHeader />
      <main className="mx-auto w-full max-w-md space-y-6 px-4 py-12">
        <PageIntro eyebrow="Daftar" title="Daftar sebagai Mahasiswa" description="Isi data diri Anda untuk mulai membaca dan mengkritisi cerpen." />
        <Card>
          <form action={registerAction} className="space-y-4">
            <ErrorBanner message={error} />
            <Field label="Email" name="email"><input id="email" name="email" type="email" className={inputClassName} autoComplete="email" required /></Field>
            <Field label="Nama Lengkap" name="name"><input id="name" name="name" className={inputClassName} required minLength={2} /></Field>
            <Field label="Kata Sandi" name="password" helper="Minimal 6 karakter"><input id="password" name="password" type="password" className={inputClassName} required minLength={6} /></Field>
            <Field label="Program Studi" name="programStudy"><input id="programStudy" name="programStudy" className={inputClassName} /></Field>
            <Field label="Universitas" name="university"><input id="university" name="university" className={inputClassName} /></Field>
            <FormSubmit pendingLabel="Mendaftarkan...">Daftar</FormSubmit>
          </form>
        </Card>
        <p className="text-center text-sm text-muted">Sudah punya akun? <Link href="/masuk" className="font-semibold text-primary underline underline-offset-4">Masuk di sini</Link></p>
      </main>
    </div>
  );
}
