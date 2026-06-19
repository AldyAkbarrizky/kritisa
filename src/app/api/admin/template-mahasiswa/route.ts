import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import * as XLSX from "xlsx";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "dosen") {
    return NextResponse.json(
      { ok: false, error: { message: "Akses membutuhkan login dosen." } },
      { status: 401 },
    );
  }

  const format = request.nextUrl.searchParams.get("format") ?? "csv";
  const header = [
    "Email",
    "Nama Lengkap",
    "Program Studi",
    "Universitas",
    "Kata Sandi",
  ];
  const example = [
    "mhs1@kampus.ac.id",
    "Andi Prasetyo",
    "Sastra Indonesia",
    "Universitas Indonesia",
    "kritisa123",
  ];

  if (format === "xlsx") {
    const ws = XLSX.utils.aoa_to_sheet([header, example]);
    ws["!cols"] = [
      { wch: 28 },
      { wch: 24 },
      { wch: 22 },
      { wch: 28 },
      { wch: 15 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    return new Response(buf, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          "attachment; filename=template-import-mahasiswa.xlsx",
      },
    });
  }

  const csv = `\uFEFF${header.join(",")}\n${example.join(",")}`;
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition":
        "attachment; filename=template-import-mahasiswa.csv",
    },
  });
}
