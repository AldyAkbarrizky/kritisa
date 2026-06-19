import type { Metadata } from "next";
import { loginAction } from "@/app/actions";
import { FormSubmit } from "@/components/form-submit";
import { StudentHeader } from "@/components/student-header";
import {
  Card,
  ErrorBanner,
  Field,
  PageIntro,
  inputClassName,
} from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { firstSearchValue, safeInternalPath } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Masuk" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [query, user] = await Promise.all([searchParams, getCurrentUser()]);
  if (user) redirect(user.role === "dosen" ? "/dosen/dashboard" : "/cerpen");

  const next = safeInternalPath(firstSearchValue(query.next), "/cerpen");
  const error = firstSearchValue(query.error);

  return (
    <div className="min-h-screen bg-background">
      <StudentHeader />
      <main className="mx-auto w-full max-w-md space-y-6 px-4 py-12">
        <PageIntro
          eyebrow="Masuk"
          title="Masuk ke Kritisa"
          description="Gunakan email dan kata sandi Anda."
        />
        <Card>
          <form action={loginAction} className="space-y-4">
            <input type="hidden" name="next" value={next} />
            <ErrorBanner message={error} />
            <Field label="Email" name="email">
              <input
                id="email"
                name="email"
                className={inputClassName}
                autoComplete="email"
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
    </div>
  );
}
