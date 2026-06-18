import type { Metadata } from "next";
import { createMediaSourceAction } from "@/app/actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { FormSubmit } from "@/components/form-submit";
import {
  Card,
  ErrorBanner,
  Field,
  inputClassName,
} from "@/components/ui";
import { requireAdminSession } from "@/lib/session";
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
  await requireAdminSession();
  const query = await searchParams;
  const error = firstSearchValue(query.error);

  return (
    <DashboardShell
      title="Tambah Media Sumber"
      description="Tambahkan media penerbit baru untuk cerpen."
    >
      <Card>
        <form action={createMediaSourceAction} className="space-y-4">
          <ErrorBanner message={error} />
          <Field label="Nama Media" name="name">
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
          <Field
            label="Slug"
            name="slug"
            helper="Kosongkan untuk dibuat otomatis dari nama."
          >
            <input
              id="slug"
              name="slug"
              className={inputClassName}
              maxLength={80}
              placeholder="kompas"
            />
          </Field>
          <Field label="URL Website" name="websiteUrl">
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
