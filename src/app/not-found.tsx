import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center gap-4 bg-background px-4 py-8">
      <div className="rounded-lg border border-border bg-surface p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-foreground">Halaman tidak ditemukan</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Konten yang kamu cari tidak tersedia atau belum dipublikasikan.
        </p>
        <div className="mt-4">
          <ButtonLink href="/cerpen">Kembali ke Katalog</ButtonLink>
        </div>
      </div>
    </main>
  );
}
