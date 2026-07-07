"use client";

import { useEffect, useRef } from "react";
import type { MediaSource, StoryWithMedia } from "@/lib/types";
import { createStoryAction, updateStoryAction } from "@/app/actions";
import { FormSubmit } from "@/components/form-submit";
import { ImageUpload } from "@/components/image-upload";
import {
  Button,
  Card,
  ErrorBanner,
  Field,
  SuccessBanner,
  inputClassName,
  textareaClassName,
} from "@/components/ui";
import type { ImportPrefill } from "@/components/import-cerpen-modal";

export function StoryForm({
  mediaSources,
  story,
  error,
  saved,
  prefill,
}: {
  mediaSources: MediaSource[];
  story?: StoryWithMedia;
  error?: string | null;
  saved?: boolean;
  prefill?: ImportPrefill | null;
}) {
  const action = story ? updateStoryAction : createStoryAction;
  const returnPath = story
    ? `/dosen/cerpen/${story.id}/edit`
    : "/dosen/cerpen/tambah";
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!prefill || !formRef.current) return;
    const form = formRef.current;
    const setVal = (id: string, value: string) => {
      const el = form.querySelector<HTMLInputElement | HTMLTextAreaElement>(
        `#${id}`,
      );
      if (el) {
        el.value = value;
        el.dispatchEvent(new Event("input", { bubbles: true }));
      }
    };
    if (prefill.title) setVal("title", prefill.title);
    if (prefill.author) setVal("author", prefill.author);
    if (prefill.sourceUrl) setVal("sourceUrl", prefill.sourceUrl);
    if (prefill.publishedAt) setVal("publishedAt", prefill.publishedAt);
    if (prefill.publicationMonth)
      setVal("publicationMonth", prefill.publicationMonth);
    if (prefill.summary) setVal("summary", prefill.summary);
    if (prefill.content) setVal("content", prefill.content);
    if (prefill.matchedMediaSourceId) {
      setVal("mediaSourceId", prefill.matchedMediaSourceId);
    }
  }, [prefill]);

  function handleClearContent() {
    const el = document.getElementById("content") as HTMLTextAreaElement | null;
    if (el) {
      el.value = "";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }

  return (
    <Card>
      <form ref={formRef} action={action} className="space-y-4" id="story-form">
        <input type="hidden" name="id" value={story?.id ?? ""} />
        <input type="hidden" name="returnPath" value={returnPath} />
        <ErrorBanner message={error} />
        <SuccessBanner
          message={saved ? "Perubahan cerpen berhasil disimpan." : null}
        />

        <Field label="Judul" name="title" required>
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

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Penulis" name="author" labelSuffix="(Opsional)">
            <input
              id="author"
              name="author"
              className={inputClassName}
              defaultValue={story?.author ?? ""}
              maxLength={160}
            />
          </Field>

          <Field label="Media" name="mediaSourceId" required>
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
          <Field
            label="Tanggal Terbit"
            name="publishedAt"
            labelSuffix="(Opsional)"
            helper="Isi jika tahu tanggal persis."
          >
            <input
              id="publishedAt"
              name="publishedAt"
              type="date"
              className={inputClassName}
              defaultValue={
                story?.publishedAt &&
                story.publishedAt !== `${story.publicationMonth}-01`
                  ? story.publishedAt
                  : ""
              }
            />
          </Field>

          <Field
            label="Bulan Terbit"
            name="publicationMonth"
            labelSuffix="(Opsional)"
            helper="Atau cukup bulan & tahun saja."
          >
            <input
              id="publicationMonth"
              name="publicationMonth"
              type="month"
              className={inputClassName}
              defaultValue={story?.publicationMonth ?? ""}
            />
          </Field>
        </div>

        <Field
          label="URL Sumber"
          name="sourceUrl"
          labelSuffix="(Opsional)"
          helper="Simpan atribusi sumber bila tersedia."
        >
          <input
            id="sourceUrl"
            name="sourceUrl"
            type="url"
            className={inputClassName}
            defaultValue={story?.sourceUrl ?? ""}
            placeholder="https://..."
          />
        </Field>

        <Field
          label="Gambar Sampul"
          name="coverImageUrl"
          labelSuffix="(Opsional)"
          helper="Tempel URL atau unggah gambar. Jika kosong, UI memakai blok warna."
        >
          <div className="space-y-2">
            <input
              id="coverImageUrl"
              name="coverImageUrl"
              type="url"
              className={inputClassName}
              defaultValue={story?.coverImageUrl ?? ""}
              placeholder="https://..."
            />
            <ImageUpload
              label="Unggah Gambar"
              onUploaded={(url) => {
                const input = document.getElementById(
                  "coverImageUrl",
                ) as HTMLInputElement | null;
                if (input) {
                  input.value = url;
                  input.dispatchEvent(new Event("input", { bubbles: true }));
                }
              }}
            />
          </div>
        </Field>

        <Field label="Ringkasan" name="summary" required>
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

        <Field
          label="Isi Cerpen"
          name="content"
          required
          helper="Gunakan teks polos. Tekan Enter untuk paragraf baru."
        >
          <textarea
            id="content"
            name="content"
            className="min-h-72 w-full rounded-lg border border-border bg-surface px-3 py-3 text-base leading-7 text-foreground shadow-sm outline-none transition placeholder:text-muted/80 focus:border-primary focus:ring-4 focus:ring-primary/10"
            defaultValue={story?.content ?? ""}
            required
            minLength={80}
          />
          <div className="mt-1 flex justify-end">
            <Button type="button" variant="ghost" onClick={handleClearContent}>
              ✕ Hapus Isi
            </Button>
          </div>
        </Field>

        <Field label="Status" name="status" labelSuffix="(Opsional)">
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
          <FormSubmit fullWidth={false}>
            {story ? "Simpan Perubahan" : "Tambah Cerpen"}
          </FormSubmit>
        </div>
      </form>
    </Card>
  );
}
