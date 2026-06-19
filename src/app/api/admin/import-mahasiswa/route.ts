import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, registerUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "dosen") {
    return NextResponse.json({ ok: false, error: { message: "Akses membutuhkan login dosen." } }, { status: 401 });
  }

  let body: { data?: unknown[][] };
  try { body = await request.json(); } catch {
    return NextResponse.json({ ok: false, error: { message: "Format data tidak valid." } }, { status: 400 });
  }

  if (!body.data || !Array.isArray(body.data) || body.data.length < 2) {
    return NextResponse.json({ ok: false, error: { message: "Data Excel kosong." } }, { status: 400 });
  }

  const rows = body.data;
  const header = rows[0] as string[];
  const emailIdx = header.findIndex(h => String(h).toLowerCase().includes("email"));
  const nameIdx = header.findIndex(h => String(h).toLowerCase().includes("nama"));

  if (emailIdx === -1 || nameIdx === -1) {
    return NextResponse.json({ ok: false, error: { message: "Kolom Email dan Nama wajib ada." } }, { status: 400 });
  }

  const prodiIdx = header.findIndex(h => String(h).toLowerCase().includes("prodi") || String(h).toLowerCase().includes("program studi"));
  const univIdx = header.findIndex(h => String(h).toLowerCase().includes("universitas"));
  const passIdx = header.findIndex(h => String(h).toLowerCase().includes("kata sandi") || String(h).toLowerCase().includes("password"));

  let imported = 0; const errs: string[] = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const email = String(r[emailIdx] ?? "").trim();
    const name = String(r[nameIdx] ?? "").trim();
    if (!email || !name) { errs.push(`Baris ${i + 1}: Email & Nama wajib`); continue; }
    const result = await registerUser({
      email, name,
      password: String(passIdx >= 0 ? r[passIdx] : "kritisa123").trim() || "kritisa123",
      programStudy: prodiIdx >= 0 ? String(r[prodiIdx] ?? "").trim() : "",
      university: univIdx >= 0 ? String(r[univIdx] ?? "").trim() : "",
    });
    if (result.ok) imported++; else errs.push(`Baris ${i + 1}: ${result.message}`);
  }
  return NextResponse.json({ ok: true, data: { imported, errors: errs } });
}
