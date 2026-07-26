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
import { firstSearchValue, formatPublishDate } from "@/lib/utils";

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
  const quoteText = quote || quoteFallbackMessage;
  // ~400 karakter ≈ 6 baris pada kolom 328px; di bawah itu tak perlu dilipat.
  const isLongQuote = quoteText.length > 400;
  const latestAnnotation = user
    ? await getLatestAnnotation(user.id, story.id)
    : null;

  return (
    <div className="min-h-dvh bg-background">
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

        <Card className="space-y-3 border-l-4 border-l-accent bg-accent-soft">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="primary">{story.mediaSource.name}</Badge>
            <span className="text-xs text-muted sm:hidden">
              {formatPublishDate(story.publishedAt, story.publicationMonth)}
            </span>
            <span className="hidden sm:inline">
              <Badge tone="accent">
                {formatPublishDate(story.publishedAt, story.publicationMonth)}
              </Badge>
            </span>
          </div>
          {/* Kutipan panjang dilipat agar form kritik tetap terjangkau tanpa
              menggulir jauh. `<details>` dipilih supaya tetap jalan tanpa JS;
              seluruh isinya ditaruh di <summary> agar labelnya bisa menutup
              kembali — elemen di luar <summary> tak bisa men-toggle. */}
          {isLongQuote ? (
            <details className="group">
              <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <blockquote className="line-clamp-6 font-serif text-base leading-7 text-foreground group-open:line-clamp-none">
                  {quoteText}
                </blockquote>
                <span className="mt-2 inline-block text-sm font-semibold text-accent-strong underline underline-offset-4">
                  <span className="group-open:hidden">
                    Baca kutipan selengkapnya
                  </span>
                  <span className="hidden group-open:inline">
                    Ringkaskan kutipan
                  </span>
                </span>
              </summary>
            </details>
          ) : (
            <blockquote className="font-serif text-base leading-7 text-foreground">
              {quoteText}
            </blockquote>
          )}
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
