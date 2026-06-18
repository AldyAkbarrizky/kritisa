import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { adminLoginAction } from "@/app/actions";
import { FormSubmit } from "@/components/form-submit";
import { Card, ErrorBanner, Field, PageIntro, inputClassName } from "@/components/ui";
import { isAdminAuthenticated } from "@/lib/session";
import { firstSearchValue, safeInternalPath } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Masuk Dashboard Dosen",
};

export default async function LecturerLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const query = await searchParams;
  const next = safeInternalPath(firstSearchValue(query.next), "/dosen/dashboard");
  const error = firstSearchValue(query.error);

  if (await isAdminAuthenticated()) {
    redirect(next);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-5 bg-background px-4 py-8">
      <PageIntro
        eyebrow="Dashboard Dosen"
        title="Masuk Dashboard Dosen"
        description="Gunakan kredensial admin dari environment untuk mengakses jawaban dan pengelolaan cerpen."
      />
      <Card>
        <form action={adminLoginAction} className="space-y-4">
          <input type="hidden" name="next" value={next} />
          <ErrorBanner message={error} />
          <Field label="Nama Pengguna" name="username">
            <input
              id="username"
              name="username"
              className={inputClassName}
              autoComplete="username"
              required
            />
          </Field>
          <Field label="Kata Sandi" name="password">
            <input
              id="password"
              name="password"
              type="password"
              className={inputClassName}
              autoComplete="current-password"
              required
            />
          </Field>
          <FormSubmit pendingLabel="Memeriksa...">Masuk</FormSubmit>
        </form>
      </Card>
    </main>
  );
}
