"use client";

import { useState, useMemo } from "react";
import {
  useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel, getPaginationRowModel,
  flexRender, type SortingState, type ColumnFiltersState, type ColumnDef,
} from "@tanstack/react-table";
import { ButtonLink } from "@/components/ui";

export function DataTable<T>({ columns, data, searchPlaceholder = "Cari..." }: { columns: ColumnDef<T, string>[]; data: T[]; searchPlaceholder?: string }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data, columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
    globalFilterFn: (row, _, filterValue) => {
      const search = String(filterValue).toLowerCase();
      return String(row.getValue("name") ?? "").toLowerCase().includes(search) ||
        String(row.getValue("email") ?? "").toLowerCase().includes(search) ||
        String(row.getValue("programStudy") ?? "").toLowerCase().includes(search) ||
        String(row.getValue("university") ?? "").toLowerCase().includes(search);
    },
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          placeholder={searchPlaceholder}
          value={globalFilter}
          onChange={e => setGlobalFilter(e.target.value)}
          className="min-h-10 w-full max-w-sm rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted/80 focus:border-primary focus:ring-4 focus:ring-primary/10"
        />
        <span className="text-sm text-muted">{table.getFilteredRowModel().rows.length} data</span>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
        <div className="max-w-full overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-surface-muted text-xs uppercase text-muted">
              {table.getHeaderGroups().map(hg => (
                <tr key={hg.id}>
                  {hg.headers.map(header => (
                    <th key={header.id} className="px-4 py-3 select-none">
                      {header.isPlaceholder ? null : (
                        <div
                          className={`flex items-center gap-1 ${header.column.getCanSort() ? "cursor-pointer" : ""}`}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{ asc: " ▲", desc: " ▼" }[header.column.getIsSorted() as string] ?? ""}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-muted">Tidak ada data.</td></tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="border-t border-border align-top">
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-1">
          <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="min-h-9 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-semibold text-foreground transition hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50">← Sebelumnya</button>
          <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="min-h-9 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-semibold text-foreground transition hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50">Selanjutnya →</button>
        </div>
        <span className="text-muted">
          Halaman {table.getState().pagination.pageIndex + 1} dari {table.getPageCount()}
        </span>
        <select value={table.getState().pagination.pageSize} onChange={e => table.setPageSize(Number(e.target.value))} className="min-h-9 rounded-lg border border-border bg-surface px-2 py-1.5 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 cursor-pointer hover:border-primary">
          {[5, 10, 20, 50].map(s => <option key={s} value={s}>{s} / halaman</option>)}
        </select>
      </div>
    </div>
  );
}
