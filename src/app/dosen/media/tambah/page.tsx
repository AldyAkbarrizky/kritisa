import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createMediaSourceAction } from "@/app/actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { FormSubmit } from "@/components/form-submit";
import { Card, ErrorBanner, Field, inputClassName } from "@/components/ui";
import { requireAuth } from "@/lib/auth";
import { firstSearchValue } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tambah Media",
};

export default async function CreateMediaSourcePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  if (!(await requireAuth("dosen"))) notFound();
  const query = await searchParams;
  const error = firstSearchValue(query.error);

  return (
    <DashboardShell
      title="Tambah Media Sumber"
      description="Tambahkan media penerbit baru untuk cerpen."
      backHref="/dosen/media"
    >
      <Card>
        <form action={createMediaSourceAction} className="space-y-4">
          <ErrorBanner message={error} />
          <Field label="Nama Media" name="name" required>
            <input
              id="name"
              name="name"
              className={inputClassName}
              required
              minLength={2}
              maxLength={100}
              placeholder="Contoh: Kompas, Tempo..."
            />
          </Field>
          <Field label="URL Website" name="websiteUrl" labelSuffix="(Opsional)">
            <input
              id="websiteUrl"
              name="websiteUrl"
              className={inputClassName}
              type="url"
              placeholder="https://..."
            />
          </Field>
          <FormSubmit>Tambah Media</FormSubmit>
        </form>
      </Card>
    </DashboardShell>
  );
}
