import { LoadingState } from "@/components/ui";

export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <LoadingState label="Memuat halaman..." />
    </main>
  );
}
