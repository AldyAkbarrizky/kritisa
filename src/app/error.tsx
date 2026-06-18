"use client";

import { Button } from "@/components/ui";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center gap-4 bg-background px-4 py-8">
      <div className="rounded-lg border border-danger/20 bg-surface p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-foreground">Terjadi masalah</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Halaman tidak dapat dimuat saat ini. Coba muat ulang atau kembali ke katalog.
        </p>
        <div className="mt-4">
          <Button onClick={reset}>Coba Lagi</Button>
        </div>
      </div>
    </main>
  );
}
