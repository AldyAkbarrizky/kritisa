"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";
import type { ExtractedCerpen } from "@/lib/ai/client";

type Status = "idle" | "uploading" | "extracting" | "success" | "error";

export type ImportPrefill = ExtractedCerpen & {
  matchedMediaSourceId: string | null;
  matchedMediaName: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: (data: ImportPrefill) => void;
};

export function ImportCerpenModal({ open, onClose, onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<ImportPrefill | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && status !== "uploading" && status !== "extracting") {
        handleClose();
      }
    };
    document.addEventListener("keydown", onKey);
    closeBtnRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
    // handleClose is stable enough; status controls enable/disable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, status]);

  if (!open) return null;

  function handleClose() {
    setFile(null);
    setStatus("idle");
    setErrorMsg(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onClose();
  }

  const busy = status === "uploading" || status === "extracting";

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setErrorMsg(null);
    setStatus("idle");
  }

  async function handleSubmit() {
    if (!file) return;
    setStatus("uploading");
    setErrorMsg(null);
    setResult(null);

    try {
      const form = new FormData();
      form.append("file", file);
      setStatus("extracting");
      const res = await fetch("/api/admin/import-cerpen", {
        method: "POST",
        body: form,
      });
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        data?: ImportPrefill;
        error?: { message?: string };
      };

      if (!res.ok || !json.ok || !json.data) {
        const msg =
          json.error?.message ||
          "Gagal mengekstrak data dari file. Coba lagi atau isi formulir secara manual.";
        setErrorMsg(msg);
        setStatus("error");
        return;
      }

      setResult(json.data);
      setStatus("success");
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan jaringan. Coba lagi.",
      );
      setStatus("error");
    }
  }

  function handleApply() {
    if (!result) return;
    onSuccess(result);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-cerpen-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-0 sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) handleClose();
      }}
    >
      <div className="w-full max-w-lg rounded-t-2xl border border-border bg-surface p-5 shadow-xl sm:rounded-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2
              id="import-cerpen-title"
              className="text-lg font-bold text-foreground"
            >
              Import Cerpen dari .docx
            </h2>
            <p className="mt-1 text-xs leading-5 text-muted">
              Unggah file .docx (maks 10 MB). AI akan mengekstrak judul,
              penulis, tanggal, ringkasan, dan isi cerpen.
            </p>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={handleClose}
            disabled={busy}
            aria-label="Tutup"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted transition hover:bg-surface-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="import-cerpen-file"
              className="block text-sm font-semibold text-foreground"
            >
              File .docx
            </label>
            <span className="mt-1 block text-xs leading-5 text-muted">
              Pilih file cerpen berformat Microsoft Word.
            </span>
            <div className="mt-2 flex items-center gap-2">
              <input
                ref={fileInputRef}
                id="import-cerpen-file"
                type="file"
                accept=".docx"
                onChange={handleFileChange}
                disabled={busy}
                className="block w-full min-w-0 flex-1 text-sm text-foreground file:mr-3 file:rounded-md file:border file:border-border file:bg-surface-muted file:px-3 file:py-2 file:text-sm file:font-semibold file:text-foreground hover:file:bg-accent-soft"
              />
            </div>
            {file ? (
              <p className="mt-2 break-all text-xs text-muted">
                {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            ) : null}
          </div>

          {errorMsg ? (
            <div
              role="alert"
              className="rounded-lg border border-danger/20 bg-danger/10 p-3 text-sm leading-6 text-danger"
            >
              {errorMsg}
            </div>
          ) : null}

          {status === "success" && result ? (
            <div className="rounded-lg border border-success/20 bg-success/10 p-3 text-sm leading-6 text-success">
              <p className="font-semibold">Berhasil diekstrak.</p>
              <p className="mt-1 text-xs text-foreground/80">
                Judul: <strong>{result.title}</strong>
                {result.matchedMediaName ? (
                  <>
                    {" "}
                    · Media: <strong>{result.matchedMediaName}</strong>
                  </>
                ) : null}
              </p>
              <p className="text-xs text-foreground/80">
                Ringkasan: {result.summary.length} karakter · Isi:{" "}
                {result.content.length} karakter
              </p>
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={busy}
            >
              {status === "success" ? "Batal" : "Tutup"}
            </Button>
            {status === "success" ? (
              <Button type="button" onClick={handleApply}>
                Terapkan ke Form
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!file || busy}
              >
                {status === "uploading"
                  ? "Mengunggah..."
                  : status === "extracting"
                    ? "AI sedang membaca..."
                    : "Ekstrak dengan AI"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
