import type { MediaSource, StoryWithMedia } from "@/lib/types";
import { createStoryAction, updateStoryAction } from "@/app/actions";
import { FormSubmit } from "@/components/form-submit";
import { Card, ErrorBanner, Field, SuccessBanner, inputClassName, textareaClassName } from "@/components/ui";

export function StoryForm({
  mediaSources,
  story,
  error,
  saved,
}: {
  mediaSources: MediaSource[];
  story?: StoryWithMedia;
  error?: string | null;
  saved?: boolean;
}) {
  const action = story ? updateStoryAction : createStoryAction;
  const returnPath = story ? `/dosen/cerpen/${story.id}/edit` : "/dosen/cerpen/tambah";

  return (
    <Card>
      <form action={action} className="space-y-4">
        <input type="hidden" name="id" value={story?.id ?? ""} />
        <input type="hidden" name="returnPath" value={returnPath} />
        <ErrorBanner message={error} />
        <SuccessBanner message={saved ? "Perubahan cerpen berhasil disimpan." : null} />

        <Field label="Judul" name="title">
          <input
            id="title"
            name="title"
            className={inputClassName}
            defaultValue={story?.title ?? ""}
            required
            minLength={3}
            maxLength={200}
          />
        </Field>

        <Field label="Slug" name="slug" helper="Kosongkan saat membuat cerpen agar dibuat dari judul.">
          <input
            id="slug"
            name="slug"
            className={inputClassName}
            defaultValue={story?.slug ?? ""}
            maxLength={100}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Penulis" name="author">
            <input
              id="author"
              name="author"
              className={inputClassName}
              defaultValue={story?.author ?? ""}
              maxLength={160}
            />
          </Field>

          <Field label="Media" name="mediaSourceId">
            <select
              id="mediaSourceId"
              name="mediaSourceId"
              className={inputClassName}
              defaultValue={story?.mediaSourceId ?? mediaSources[0]?.id ?? ""}
              required
            >
              {mediaSources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tanggal Terbit" name="publishedAt" helper="Opsional.">
            <input
              id="publishedAt"
              name="publishedAt"
              type="date"
              className={inputClassName}
              defaultValue={story?.publishedAt ?? ""}
            />
          </Field>

          <Field label="Bulan Terbit" name="publicationMonth">
            <input
              id="publicationMonth"
              name="publicationMonth"
              type="month"
              className={inputClassName}
              defaultValue={story?.publicationMonth ?? ""}
              required
            />
          </Field>
        </div>

        <Field label="URL Sumber" name="sourceUrl" helper="Simpan atribusi sumber bila tersedia.">
          <input
            id="sourceUrl"
            name="sourceUrl"
            type="url"
            className={inputClassName}
            defaultValue={story?.sourceUrl ?? ""}
            placeholder="https://..."
          />
        </Field>

        <Field label="URL Gambar Sampul" name="coverImageUrl" helper="Opsional. Jika kosong, UI memakai blok warna.">
          <input
            id="coverImageUrl"
            name="coverImageUrl"
            type="url"
            className={inputClassName}
            defaultValue={story?.coverImageUrl ?? ""}
            placeholder="https://..."
          />
        </Field>

        <Field label="Ringkasan" name="summary">
          <textarea
            id="summary"
            name="summary"
            className={textareaClassName}
            defaultValue={story?.summary ?? ""}
            required
            minLength={20}
            maxLength={600}
          />
        </Field>

        <Field label="Isi Cerpen" name="content" helper="Gunakan teks polos. Pisahkan paragraf dengan baris kosong.">
          <textarea
            id="content"
            name="content"
            className="min-h-72 w-full rounded-lg border border-border bg-surface px-3 py-3 text-base leading-7 text-foreground shadow-sm outline-none transition placeholder:text-muted/80 focus:border-primary focus:ring-4 focus:ring-primary/10"
            defaultValue={story?.content ?? ""}
            required
            minLength={80}
          />
        </Field>

        <Field label="Status" name="status">
          <select
            id="status"
            name="status"
            className={inputClassName}
            defaultValue={story?.status ?? "draft"}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </Field>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <FormSubmit fullWidth={false}>{story ? "Simpan Perubahan" : "Tambah Cerpen"}</FormSubmit>
        </div>
      </form>
    </Card>
  );
}
