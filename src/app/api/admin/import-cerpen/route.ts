import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import { requireAuth } from "@/lib/auth";
import { extractCerpenMetadata } from "@/lib/ai/client";
import { getMediaSources } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_TEXT_LENGTH = 15_000; // max chars sent to AI (fit under 12K TPM with 7K output)
const COOLDOWN_MS = 30_000;

const lastCallByUser = new Map<string, number>();

function isDocxMagic(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 4 &&
    bytes[0] === 0x50 &&
    bytes[1] === 0x4b &&
    (bytes[2] === 0x03 || bytes[2] === 0x05 || bytes[2] === 0x07) &&
    (bytes[3] === 0x04 || bytes[3] === 0x06 || bytes[3] === 0x08)
  );
}

function sanitizeTextForPrompt(value: string): string {
  return value
    .replace(/\u0000/g, "")
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F]/g, "") // strip control chars except tab, LF, CR
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function POST(request: NextRequest) {
  const user = await requireAuth("dosen");
  if (!user) {
    return NextResponse.json(
      {
        ok: false,
        error: { message: "Hanya dosen yang dapat mengimpor cerpen." },
      },
      { status: 401 },
    );
  }

  const prev = lastCallByUser.get(user.id) ?? 0;
  const now = Date.now();
  if (now - prev < COOLDOWN_MS) {
    const wait = Math.ceil((COOLDOWN_MS - (now - prev)) / 1000);
    return NextResponse.json(
      {
        ok: false,
        error: {
          message: `Tunggu ${wait} detik sebelum mencoba import lagi.`,
        },
      },
      { status: 429 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { ok: false, error: { message: "Permintaan tidak valid." } },
      { status: 400 },
    );
  }

  const fileEntry = formData.get("file");
  if (!fileEntry || typeof fileEntry === "string") {
    return NextResponse.json(
      {
        ok: false,
        error: { message: "File .docx tidak ditemukan dalam permintaan." },
      },
      { status: 400 },
    );
  }

  const file = fileEntry as File;
  const fileName = file.name || "tanpa-nama.docx";

  if (!/\.docx$/i.test(fileName)) {
    return NextResponse.json(
      {
        ok: false,
        error: { message: "Hanya file dengan ekstensi .docx yang didukung." },
      },
      { status: 400 },
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    const sizeMb = (file.size / 1024 / 1024).toFixed(1);
    return NextResponse.json(
      {
        ok: false,
        error: {
          message: `File terlalu besar (${sizeMb} MB). Maksimal 10 MB.`,
        },
      },
      { status: 413 },
    );
  }

  if (file.size === 0) {
    return NextResponse.json(
      { ok: false, error: { message: "File kosong." } },
      { status: 400 },
    );
  }

  const buffer = new Uint8Array(await file.arrayBuffer());
  if (!isDocxMagic(buffer)) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          message: "File bukan .docx yang valid (signature tidak dikenali).",
        },
      },
      { status: 400 },
    );
  }

  let rawText: string;
  try {
    const result = await mammoth.extractRawText({
      buffer: Buffer.from(buffer),
    });
    rawText = result.value || "";
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          message: `Gagal membaca file .docx: ${err instanceof Error ? err.message : "kesalahan tidak dikenal"}`,
        },
      },
      { status: 400 },
    );
  }

  // Potong teks mentah SEBELUM sanitasi agar regex tidak berjalan
  // di atas jutaan karakter (file .docx besar bisa lambat/timeout).
  // MAX_TEXT_LENGTH * 2 memberi ruang cukup untuk AI membaca konteks.
  const capped =
    rawText.length > MAX_TEXT_LENGTH * 2
      ? rawText.slice(0, MAX_TEXT_LENGTH * 2)
      : rawText;

  const sanitized = sanitizeTextForPrompt(capped);
  if (sanitized.length < 80) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          message:
            "Teks di dalam .docx terlalu pendek. Pastikan file berisi cerpen yang dapat dibaca.",
        },
      },
      { status: 400 },
    );
  }

  const truncated =
    sanitized.length > MAX_TEXT_LENGTH
      ? sanitized.slice(0, MAX_TEXT_LENGTH)
      : sanitized;

  lastCallByUser.set(user.id, now);

  const extraction = await extractCerpenMetadata(truncated);
  if (!extraction.ok) {
    return NextResponse.json(
      { ok: false, error: { message: extraction.message } },
      { status: 422 },
    );
  }

  const mediaSources = await getMediaSources();
  const matchedMedia = extraction.data.mediaName
    ? mediaSources.find(
        (m) =>
          m.name.toLowerCase().trim() ===
          extraction.data.mediaName!.toLowerCase().trim(),
      )
    : null;

  return NextResponse.json({
    ok: true,
    data: {
      ...extraction.data,
      matchedMediaSourceId: matchedMedia?.id ?? null,
      matchedMediaName: matchedMedia?.name ?? null,
      truncated: sanitized.length > MAX_TEXT_LENGTH,
      fileName,
    },
  });
}
