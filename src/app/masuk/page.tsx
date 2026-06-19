import type { Metadata } from "next";
import { saveStudentIdentityAction } from "@/app/actions";
import { FormSubmit } from "@/components/form-submit";
import { StudentHeader } from "@/components/student-header";
import {
  Card,
  ErrorBanner,
  Field,
  PageIntro,
  inputClassName,
} from "@/components/ui";
import { getCurrentStudent } from "@/lib/session";
import { firstSearchValue, safeInternalPath } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Masuk Mahasiswa",
};

export default async function StudentLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const query = await searchParams;
  const student = await getCurrentStudent();
  const next = safeInternalPath(firstSearchValue(query.next), "/cerpen");
  const error = firstSearchValue(query.error);

  return (
    <div className="min-h-screen bg-background">
      <StudentHeader />
      <main className="mx-auto w-full max-w-xl space-y-6 px-4 py-8 sm:px-6 sm:py-12">
        <PageIntro
          eyebrow="Identitas Mahasiswa"
          title="Masuk sebagai Mahasiswa"
          description="Isi identitas singkat agar jawaban dan refleksi Anda dapat tersimpan dengan benar."
        />
        <Card>
          <form action={saveStudentIdentityAction} className="space-y-4">
            <input type="hidden" name="next" value={next} />
            <ErrorBanner message={error} />
            <Field label="Nama" name="name">
              <input
                id="name"
                name="name"
                className={inputClassName}
                defaultValue={student?.name ?? ""}
                required
                minLength={2}
                maxLength={100}
                autoComplete="name"
              />
            </Field>
            <Field label="Program Studi" name="programStudy">
              <input
                id="programStudy"
                name="programStudy"
                className={inputClassName}
                defaultValue={student?.programStudy ?? ""}
                required
                minLength={2}
                maxLength={120}
              />
            </Field>
            <Field label="Universitas" name="university">
              <input
                id="university"
                name="university"
                className={inputClassName}
                defaultValue={student?.university ?? ""}
                required
                minLength={2}
                maxLength={150}
              />
            </Field>
            <FormSubmit pendingLabel="Menyimpan identitas...">
              Lanjut Membaca
            </FormSubmit>
          </form>
        </Card>
      </main>
    </div>
  );
}
