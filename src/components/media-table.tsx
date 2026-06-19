"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { deleteMediaSourceAction } from "@/app/actions";
import { DataTable } from "@/components/data-table";
import { FormSubmit } from "@/components/form-submit";
import type { MediaSource } from "@/lib/types";

export function MediaTable({ sources }: { sources: MediaSource[] }) {
  const columns = useMemo<ColumnDef<MediaSource, string>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Nama",
        cell: (info) => (
          <strong className="text-foreground">{info.getValue()}</strong>
        ),
      },
      {
        accessorKey: "slug",
        header: "Slug",
        cell: (info) => (
          <span className="text-muted font-mono text-xs">{info.getValue()}</span>
        ),
      },
      {
        accessorKey: "websiteUrl",
        header: "Website URL",
        cell: (info) => {
          const url = info.getValue();
          return url ? (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="text-primary underline underline-offset-4 hover:text-accent-strong transition"
            >
              {url}
            </a>
          ) : (
            <span className="text-muted">-</span>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: (info) => (
          <div className="flex gap-2">
            <Link
              href={`/dosen/media/${info.row.original.id}/edit`}
              className="inline-flex min-h-9 items-center justify-center rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-surface-muted"
            >
              Edit
            </Link>
            <form action={deleteMediaSourceAction}>
              <input type="hidden" name="id" value={info.row.original.id} />
              <FormSubmit variant="danger" fullWidth={false} pendingLabel="...">
                Hapus
              </FormSubmit>
            </form>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <DataTable
      columns={columns}
      data={sources}
      searchPlaceholder="Cari nama media..."
    />
  );
}
