"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui";
import type { AnswerRow } from "@/lib/types";
import { formatDateTime, perspectiveLabel, truncate } from "@/lib/utils";

export function JawabanTable({ rows }: { rows: AnswerRow[] }) {
  const columns = useMemo<ColumnDef<AnswerRow, string>[]>(
    () => [
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
    <DataTable
      columns={columns}
      data={rows}
      searchPlaceholder="Cari nama, judul, atau isi..."
    />
  );
}
