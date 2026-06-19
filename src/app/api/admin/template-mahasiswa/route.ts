import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "dosen") return NextResponse.json({ ok: false, error: { message: "Akses membutuhkan login dosen." } }, { status: 401 });

  const csv = "Email,Nama Lengkap,Program Studi,Universitas,Kata Sandi\nmhs1@kampus.ac.id,Andi Prasetyo,Sastra Indonesia,Universitas Indonesia,kritisa123";
  return new Response(`\uFEFF${csv}`, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=template-import-mahasiswa.csv" } });
}
