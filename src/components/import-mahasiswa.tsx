"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { ButtonLink, SuccessBanner, ErrorBanner } from "@/components/ui";

export function ImportMahasiswaButton() {
  const [importMsg, setImportMsg] = useState("");
  const [importErr, setImportErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportMsg(""); setImportErr("");

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const wb = XLSX.read(ev.target?.result, { type: "binary" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });
        if (data.length < 2) { setImportErr("File Excel kosong."); return; }

        const res = await fetch("/api/admin/import-mahasiswa", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data }),
        });
        const json = await res.json() as { ok: boolean; data?: { imported: number; errors: string[] }; error?: { message: string } };
        if (!json.ok) { setImportErr(json.error?.message ?? "Gagal import."); return; }
        setImportMsg(`Berhasil import ${json.data!.imported} mahasiswa.${json.data!.errors.length ? ` ${json.data!.errors.length} error.` : ""}`);
        if (json.data!.errors.length > 0) setImportErr(json.data!.errors.join("\n"));
        router.refresh();
      } catch { setImportErr("Gagal membaca file Excel."); }
    };
    reader.readAsBinaryString(file);
  }

  return (
    <>
      <SuccessBanner message={importMsg || undefined} />
      <ErrorBanner message={importErr || undefined} />
      <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleImport} className="hidden" />
      <button onClick={() => fileRef.current?.click()} className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-strong">Import Excel</button>
      <ButtonLink href="/api/admin/template-mahasiswa" variant="secondary">Download Template</ButtonLink>
    </>
  );
}
