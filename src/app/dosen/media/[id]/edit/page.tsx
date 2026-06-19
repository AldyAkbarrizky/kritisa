import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { updateMediaSourceAction } from "@/app/actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { FormSubmit } from "@/components/form-submit";
import {
  Card,
  ErrorBanner,
  Field,
  inputClassName,
} from "@/components/ui";
import { requireAuth } from "@/lib/auth";
import { getMediaSourceById } from "@/lib/storage";
import { firstSearchValue } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit Media",
};

export default async function EditMediaSourcePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  if (!(await requireAuth("dosen"))) notFound();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const source = await getMediaSourceById(id);

  if (!source) {
    notFound();
  }

  const error = firstSearchValue(query.error);

  return (
    <DashboardShell
      title="Edit Media Sumber"
      description="Perbarui informasi media penerbit."
    >
      <Card>
        <form action={updateMediaSourceAction} className="space-y-4">
          <input type="hidden" name="id" value={source.id} />
          <ErrorBanner message={error} />
          <Field label="Nama Media" name="name">
            <input
              id="name"
              name="name"
              className={inputClassName}
              defaultValue={source.name}
              required
              minLength={2}
              maxLength={100}
            />
          </Field>
          <Field label="Slug" name="slug">
            <input
              id="slug"
              name="slug"
              className={inputClassName}
              defaultValue={source.slug}
              maxLength={80}
            />
          </Field>
          <Field label="URL Website" name="websiteUrl">
            <input
              id="websiteUrl"
              name="websiteUrl"
              className={inputClassName}
              defaultValue={source.websiteUrl}
              type="url"
              placeholder="https://..."
            />
          </Field>
          <FormSubmit>Simpan Perubahan</FormSubmit>
        </form>
      </Card>
    </DashboardShell>
  );
}
