"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { deleteMahasiswaAction } from "@/app/actions";
import { DataTable } from "@/components/data-table";
import { FormSubmit } from "@/components/form-submit";
import type { User } from "@/lib/types";

export function MahasiswaTable({ users: initialUsers }: { users: User[] }) {
  const columns = useMemo<ColumnDef<User, string>[]>(() => [
    { accessorKey: "name", header: "Nama", cell: info => <strong className="text-foreground">{info.getValue()}</strong> },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "programStudy", header: "Program Studi", cell: info => info.getValue() || "-" },
    { accessorKey: "university", header: "Universitas", cell: info => info.getValue() || "-" },
    {
      id: "actions", header: "",
      cell: info => (
        <div className="flex gap-2">
          <Link href={`/dosen/mahasiswa/${info.row.original.id}/edit`} className="inline-flex min-h-9 items-center justify-center rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-surface-muted">Edit</Link>
          <form action={deleteMahasiswaAction}>
            <input type="hidden" name="id" value={info.row.original.id} />
            <FormSubmit variant="danger" fullWidth={false} pendingLabel="...">Hapus</FormSubmit>
          </form>
        </div>
      ),
    },
  ], []);

  return <DataTable columns={columns} data={initialUsers} searchPlaceholder="Cari nama atau email mahasiswa..." />;
}
