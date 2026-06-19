"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { SuccessBanner, ErrorBanner } from "@/components/ui";

export function ImportMahasiswaButton() {
  const [importMsg, setImportMsg] = useState("");
  const [importErr, setImportErr] = useState("");
  const [showTemplate, setShowTemplate] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportMsg("");
    setImportErr("");
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const wb = XLSX.read(ev.target?.result, { type: "binary" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });
        if (data.length < 2) {
          setImportErr("File Excel kosong.");
          return;
        }
        const res = await fetch("/api/admin/import-mahasiswa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data }),
        });
        const json = (await res.json()) as {
          ok: boolean;
          data?: { imported: number; errors: string[] };
          error?: { message: string };
        };
        if (!json.ok) {
          setImportErr(json.error?.message ?? "Gagal import.");
          return;
        }
        setImportMsg(`Berhasil import ${json.data!.imported} mahasiswa.`);
        if (json.data!.errors.length)
          setImportErr(json.data!.errors.join("\n"));
        router.refresh();
      } catch {
        setImportErr("Gagal membaca file.");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <SuccessBanner message={importMsg || undefined} />
      <ErrorBanner message={importErr || undefined} />

      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleImport}
        className="hidden"
      />
      <button
        onClick={() => fileRef.current?.click()}
        className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-strong"
      >
        Import Excel
      </button>

      <div className="relative">
        <button
          onClick={() => setShowTemplate(!showTemplate)}
          className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-surface-muted"
        >
          Download Template
        </button>
        {showTemplate && (
          <div className="absolute left-0 top-full z-10 mt-1 w-44 rounded-lg border border-border bg-surface p-2 shadow-lg">
            <a
              href="/api/admin/template-mahasiswa?format=xlsx"
              onClick={() => setShowTemplate(false)}
              className="block rounded-md px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-surface-muted"
            >
              Excel (.xlsx)
            </a>
            <a
              href="/api/admin/template-mahasiswa?format=csv"
              onClick={() => setShowTemplate(false)}
              className="block rounded-md px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-surface-muted"
            >
              CSV (.csv)
            </a>
            <button
              onClick={() => setShowTemplate(false)}
              className="mt-1 w-full rounded-md px-3 py-1.5 text-xs text-muted transition hover:bg-surface-muted"
            >
              Batal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
