import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { saveAnnotationAction } from "@/app/actions";
import { FormSubmit } from "@/components/form-submit";
import { StudentHeader } from "@/components/student-header";
import {
  Badge,
  ButtonLink,
  Card,
  EmptyState,
  ErrorBanner,
  Field,
  PageIntro,
  SuccessBanner,
  inputClassName,
  textareaClassName,
} from "@/components/ui";
import { quoteFallbackMessage, selectStableQuote } from "@/lib/quote";
import { getCurrentStudent } from "@/lib/session";
import { getLatestAnnotation, getStoryBySlug } from "@/lib/storage";
import { firstSearchValue, formatMonth, perspectiveLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tulis Kritik",
};

export default async function CritiquePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [{ slug }, query, student] = await Promise.all([
    params,
    searchParams,
    getCurrentStudent(),
  ]);
  const story = await getStoryBySlug(slug);

  if (!story) {
    notFound();
  }

  const quote =
    firstSearchValue(query.quote) ?? selectStableQuote(story.content);
  const error = firstSearchValue(query.error);
  const saved = firstSearchValue(query.saved) === "1";
  const latestAnnotation = student
    ? await getLatestAnnotation(student.id, story.id)
    : null;

  return (
    <div className="min-h-screen bg-background">
      <StudentHeader />
      <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-12">
        <PageIntro
          eyebrow={story.title}
          title="Tulis Kritik terhadap Kutipan"
          description="Baca kutipan berikut, lalu tuliskan kritik atau anotasi berdasarkan pemahamanmu."
        />

        {!student ? (
          <EmptyState
            title="Identitas belum diisi"
            description="Masuk sebagai mahasiswa sebelum menyimpan kritik."
            action={
              <ButtonLink
                href={`/masuk?next=${encodeURIComponent(`/cerpen/${story.slug}/kritik`)}`}
                fullWidth
              >
                Masuk sebagai Mahasiswa
              </ButtonLink>
            }
          />
        ) : null}

        <Card className="space-y-4 border-l-4 border-l-accent bg-accent-soft">
          <div className="flex flex-wrap gap-2">
            <Badge tone="primary">{story.mediaSource.name}</Badge>
            <Badge tone="accent">{formatMonth(story.publicationMonth)}</Badge>
          </div>
          <blockquote className="text-lg font-semibold leading-8 text-foreground">
            {quote || quoteFallbackMessage}
          </blockquote>
        </Card>

        <Card>
          <form action={saveAnnotationAction} className="space-y-4">
            <input type="hidden" name="slug" value={story.slug} />
            <input type="hidden" name="quoteText" value={quote} />
            <ErrorBanner message={error} />
            <SuccessBanner
              message={saved ? "Kritikmu berhasil disimpan." : null}
            />

            <Field label="Sudut Pandang" name="perspective">
              <select
                id="perspective"
                name="perspective"
                className={inputClassName}
              >
                <option value="general">Umum</option>
                <option value="structural">Struktural</option>
                <option value="non_structural">Non-struktural</option>
              </select>
            </Field>

            <Field label="Kritik atau Anotasi" name="critiqueText">
              <textarea
                id="critiqueText"
                name="critiqueText"
                className={textareaClassName}
                placeholder="Tuliskan kritik, pertanyaan, atau pengamatanmu terhadap kutipan ini..."
                required
                minLength={20}
                maxLength={3000}
              />
            </Field>

            <FormSubmit pendingLabel="Menyimpan kritik...">
              Simpan Kritik
            </FormSubmit>
          </form>
        </Card>

        {latestAnnotation ? (
          <Card className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-foreground">
                Kritik Terakhir
              </h2>
              <Badge tone="success">
                {perspectiveLabel(latestAnnotation.perspective)}
              </Badge>
            </div>
            <p className="text-sm leading-6 text-muted">
              {latestAnnotation.critiqueText}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <ButtonLink
                href={`/cerpen/${story.slug}/diskusi`}
                variant="secondary"
                fullWidth
              >
                Diskusikan dengan AI
              </ButtonLink>
              <ButtonLink href={`/cerpen/${story.slug}/refleksi`} fullWidth>
                Lanjut ke Refleksi
              </ButtonLink>
            </div>
          </Card>
        ) : null}
      </main>
    </div>
  );
}
