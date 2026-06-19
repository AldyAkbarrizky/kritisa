"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { setStoryStatusAction, deleteStoryAction } from "@/app/actions";
import { DataTable } from "@/components/data-table";
import { FormSubmit } from "@/components/form-submit";
import { Badge } from "@/components/ui";
import type { StoryWithMedia } from "@/lib/types";
import { formatMonth } from "@/lib/utils";

export function CerpenTable({ stories }: { stories: StoryWithMedia[] }) {
  const columns = useMemo<ColumnDef<StoryWithMedia, string>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Judul",
        cell: (info) => (
          <strong className="text-foreground">{info.getValue()}</strong>
        ),
      },
      {
        accessorKey: "mediaSource.name" as keyof StoryWithMedia,
        header: "Media",
        cell: (info) => (
          <Badge tone="primary">
            {(info.row.original as StoryWithMedia).mediaSource.name}
          </Badge>
        ),
      },
      {
        accessorKey: "publicationMonth",
        header: "Bulan",
        cell: (info) => (
          <Badge tone="accent">{formatMonth(info.getValue())}</Badge>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: (info) => (
          <Badge tone={info.getValue() === "published" ? "success" : "neutral"}>
            {info.getValue() === "published" ? "Published" : "Draft"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: (info) => (
          <div className="flex gap-2">
            <Link
              href={`/dosen/cerpen/${info.row.original.id}/edit`}
              className="inline-flex min-h-9 items-center justify-center rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-surface-muted"
            >
              Edit
            </Link>
            <form action={setStoryStatusAction}>
              <input type="hidden" name="id" value={info.row.original.id} />
              <input
                type="hidden"
                name="status"
                value={
                  info.row.original.status === "published"
                    ? "draft"
                    : "published"
                }
              />
              <FormSubmit
                variant="secondary"
                fullWidth={false}
                pendingLabel="..."
              >
                {info.row.original.status === "published"
                  ? "Unpublish"
                  : "Publish"}
              </FormSubmit>
            </form>
            <form action={deleteStoryAction}>
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
      data={stories}
      searchPlaceholder="Cari judul cerpen..."
    />
  );
}
