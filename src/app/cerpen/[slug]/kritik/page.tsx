import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
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
  textareaClassName,
} from "@/components/ui";
import { quoteFallbackMessage } from "@/lib/quote";
import { getCurrentUser } from "@/lib/auth";
import { getLatestAnnotation, getStoryBySlug } from "@/lib/storage";
import { firstSearchValue, formatMonth } from "@/lib/utils";

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
  const [{ slug }, query, user] = await Promise.all([
    params,
    searchParams,
    getCurrentUser(),
  ]);
  const story = await getStoryBySlug(slug);

  if (!story) {
    notFound();
  }

  const quote = firstSearchValue(query.quote);

  if (!quote) {
    redirect(`/cerpen/${story.slug}`);
  }

  const error = firstSearchValue(query.error);
  const saved = firstSearchValue(query.saved) === "1";
  const latestAnnotation = user
    ? await getLatestAnnotation(user.id, story.id)
    : null;

  return (
    <div className="min-h-screen bg-background">
      <StudentHeader />
      <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-12">
        <PageIntro
          eyebrow={story.title}
          title="Tulis Kritik terhadap Kutipan"
          description="Baca kutipan berikut, lalu tuliskan kritik atau anotasi berdasarkan pemahaman Anda."
        />

        {!user ? (
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
              message={saved ? "Kritik Anda berhasil disimpan." : null}
            />

            <Field label="Kritik atau Anotasi" name="critiqueText">
              <textarea
                id="critiqueText"
                name="critiqueText"
                className={textareaClassName}
                placeholder="Tuliskan kritik, pertanyaan, atau pengamatan Anda terhadap kutipan ini..."
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
            </div>
            <p className="text-sm leading-6 text-muted">
              {latestAnnotation.critiqueText}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <ButtonLink
                href={`/cerpen/${story.slug}/diskusi?quote=${encodeURIComponent(quote)}`}
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
