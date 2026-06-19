"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import ReactMarkdown from "react-markdown";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui";
import type { AnswerRow } from "@/lib/types";
import { formatDateTime, perspectiveLabel, truncate } from "@/lib/utils";

function DetailModal({
  row,
  onClose,
}: {
  row: AnswerRow;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-12 sm:pt-20"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-surface shadow-lg border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-lg font-bold text-foreground">Detail Jawaban</h2>
          <button
            onClick={onClose}
            className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-muted transition hover:bg-surface-muted hover:text-foreground"
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto space-y-5 px-5 py-5">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-muted mb-1">
              Mahasiswa
            </h3>
            <p className="text-sm font-semibold text-foreground">
              {row.student.name}
            </p>
            <p className="text-xs text-muted">{row.student.email}</p>
            <p className="text-xs text-muted">
              {row.student.programStudy || "-"} ·{" "}
              {row.student.university || "-"}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-muted mb-1">
              Cerpen
            </h3>
            <p className="text-sm font-semibold text-foreground">
              {row.story.title}
            </p>
            <p className="text-xs text-muted">{row.story.mediaSource.name}</p>
          </div>

          {row.annotation?.quoteText ? (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wide text-muted mb-1">
                Kutipan
              </h3>
              <blockquote className="rounded-lg border-l-4 border-accent bg-accent-soft px-4 py-3 text-sm leading-6 text-foreground">
                {row.annotation.quoteText}
              </blockquote>
            </div>
          ) : null}

          {row.annotation?.critiqueText ? (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wide text-muted mb-1">
                Kritik · {perspectiveLabel(row.annotation.perspective)}
              </h3>
              <div className="kritisa-chat-markdown text-sm">
                <ReactMarkdown>{row.annotation.critiqueText}</ReactMarkdown>
              </div>
            </div>
          ) : null}

          {row.reflection?.promptText ? (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wide text-muted mb-1">
                Pertanyaan Refleksi
              </h3>
              <div className="kritisa-chat-markdown text-sm">
                <ReactMarkdown>{row.reflection.promptText}</ReactMarkdown>
              </div>
            </div>
          ) : null}

          {row.reflection?.answerText ? (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wide text-muted mb-1">
                Jawaban Refleksi
              </h3>
              <div className="kritisa-chat-markdown text-sm">
                <ReactMarkdown>{row.reflection.answerText}</ReactMarkdown>
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3 text-xs text-muted border-t border-border pt-4">
            <span>💬 {row.aiMessageCount} pesan diskusi AI</span>
            <span>🕐 {formatDateTime(row.latestAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function JawabanTable({ rows }: { rows: AnswerRow[] }) {
  const [selectedRow, setSelectedRow] = useState<AnswerRow | null>(null);

  const columns = useMemo<ColumnDef<AnswerRow, string>[]>(
    () => [
      {
        id: "detail",
        header: "",
        cell: (info) => (
          <button
            type="button"
            className="cursor-pointer inline-flex min-h-8 items-center justify-center rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-primary transition hover:bg-surface-muted hover:border-primary"
            onClick={() => setSelectedRow(info.row.original)}
          >
            Lihat
          </button>
        ),
      },
      {
        accessorKey: "student.name" as keyof AnswerRow,
        header: "Mahasiswa",
        cell: (info) => {
          const row = info.row.original;
          return (
            <div>
              <strong className="block text-foreground">
                {row.student.name}
              </strong>
              <span className="text-xs text-muted">
                {row.student.programStudy || "-"} ·{" "}
                {row.student.university || "-"}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "story.title" as keyof AnswerRow,
        header: "Cerpen",
        cell: (info) => {
          const row = info.row.original;
          return (
            <div>
              <strong className="block text-foreground">
                {row.story.title}
              </strong>
              <span className="text-xs text-muted">
                {row.story.mediaSource.name}
              </span>
            </div>
          );
        },
      },
      {
        id: "quote",
        header: "Kutipan",
        cell: (info) => {
          const text = info.row.original.annotation?.quoteText ?? "";
          return text ? (
            <p className="max-w-[220px] text-muted">{truncate(text, 100)}</p>
          ) : (
            <span className="text-muted">-</span>
          );
        },
      },
      {
        id: "critique",
        header: "Kritik",
        cell: (info) => {
          const ann = info.row.original.annotation;
          if (!ann?.critiqueText) return <span className="text-muted">-</span>;
          return (
            <div className="max-w-[220px]">
              {ann.perspective && ann.perspective !== "general" ? (
                <Badge tone="accent">{perspectiveLabel(ann.perspective)}</Badge>
              ) : null}
              <p className="mt-1 text-muted">
                {truncate(ann.critiqueText, 120)}
              </p>
            </div>
          );
        },
      },
      {
        id: "reflection",
        header: "Refleksi",
        cell: (info) => {
          const text = info.row.original.reflection?.answerText ?? "";
          return text ? (
            <p className="max-w-[220px] text-muted">{truncate(text, 120)}</p>
          ) : (
            <span className="text-muted">-</span>
          );
        },
      },
      {
        accessorKey: "latestAt",
        header: "Waktu",
        cell: (info) => (
          <span className="text-xs text-muted whitespace-nowrap">
            {formatDateTime(info.getValue())}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={rows}
        searchPlaceholder="Cari nama, judul, atau isi..."
      />
      {selectedRow ? (
        <DetailModal row={selectedRow} onClose={() => setSelectedRow(null)} />
      ) : null}
    </>
  );
}
