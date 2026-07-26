import Link from "next/link";
import { StudentHeader } from "@/components/student-header";
import { ButtonLink, Card, PageIntro } from "@/components/ui";
import { StoryCard } from "@/components/story-card";
import { listStories } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function Home() {
  const stories = (await listStories()).stories.slice(0, 2);

  return (
    <div className="min-h-dvh bg-background">
      <StudentHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-6 sm:gap-10 sm:px-6 sm:py-12">
        <section className="grid gap-6 md:grid-cols-[1fr_0.95fr] md:items-center">
          <div className="space-y-5">
            <PageIntro
              eyebrow="Kritisa"
              title="Kritis Melalui Sastra"
              description="Temukan makna di balik setiap cerita. KRITISA membantu mahasiswa membaca cerpen, memilih kutipan penting, berdiskusi dengan AI, dan merefleksikan pemahaman secara lebih kritis."
            />
            <div className="flex flex-col gap-2 sm:flex-row">
              <ButtonLink href="/masuk" fullWidth>
                Mulai Membaca
              </ButtonLink>
              <ButtonLink href="/cerpen" variant="secondary" fullWidth>
                Lihat Katalog Cerpen
              </ButtonLink>
            </div>
          </div>

          <div className="relative rounded-md border border-foreground bg-surface p-4 shadow-[8px_8px_0_rgb(247_139_15_/_0.12)]">
            <div className="border-b border-border pb-3">
              <p className="text-xs font-bold uppercase tracking-wide text-accent-strong">
                Catatan Baca
              </p>
              <p className="mt-2 font-serif text-lg font-bold leading-snug text-foreground sm:text-2xl sm:leading-tight">
                “Kritik dimulai dari memilih bukti, bukan menebak jawaban.”
              </p>
            </div>
            <div className="mt-4 grid gap-3">
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
                <span className="rounded-full border border-border bg-surface-muted px-2 py-2">
                  Baca
                </span>
                <span className="rounded-full border border-accent bg-accent-soft px-2 py-2 text-accent-strong">
                  Kritik
                </span>
                <span className="rounded-full border border-success/30 bg-success/10 px-2 py-2 text-success">
                  Refleksi
                </span>
              </div>
              {[
                "Pilih cerpen dari katalog media.",
                "Ambil kutipan dan tandai persoalan.",
                "Gunakan AI untuk memperluas sudut pandang.",
                "Tutup dengan refleksi personal-akademik.",
              ].map((item, index) => (
                <div
                  key={item}
                  className="grid grid-cols-[1.75rem_1fr] items-start gap-3 border-t border-border pt-3"
                >
                  <span className="font-serif text-lg font-bold leading-6 text-accent-strong">
                    0{index + 1}
                  </span>
                  <p className="text-sm leading-6 text-foreground">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-foreground">
                Cerpen Pilihan
              </h2>
              <p className="mt-1 text-sm text-muted">
                Mulai dari cerita yang sudah dipublikasikan.
              </p>
            </div>
            {/* Jangan pakai `hidden` di sini: ButtonLink sudah membawa
                `inline-flex`, dan `cn()` tidak menyelesaikan konflik kelas. */}
            <Link
              href="/cerpen"
              className="min-h-11 shrink-0 self-end whitespace-nowrap py-2 text-sm font-semibold text-primary underline underline-offset-4"
            >
              Semua
            </Link>
          </div>
          {stories.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2">
              {stories.map((story) => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>
          ) : (
            <Card>
              <p className="text-sm text-muted">
                Belum ada cerpen yang dipublikasikan.
              </p>
            </Card>
          )}
        </section>
      </main>
      <footer className="border-t border-border px-4 py-5 text-center text-sm text-muted">
        <a href="/masuk" className="font-semibold text-primary">
          Masuk Dashboard Dosen
        </a>
      </footer>
    </div>
  );
}
