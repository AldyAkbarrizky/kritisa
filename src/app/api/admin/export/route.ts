import { NextRequest } from "next/server";
import { isAdminAuthenticated } from "@/lib/session";
import { listAnswerRows } from "@/lib/storage";
import {
  csvLine,
  formatDateTime,
  formatMonth,
  perspectiveLabel,
  todayStamp,
} from "@/lib/utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return Response.json(
      { ok: false, error: { message: "Akses export membutuhkan login dosen." } },
      { status: 401 },
    );
  }

  const storyId = request.nextUrl.searchParams.get("storyId") ?? undefined;
  const rows = await listAnswerRows({ storyId });
  const header = [
    "Nama Mahasiswa",
    "Program Studi",
    "Universitas",
    "Judul Cerpen",
    "Media",
    "Bulan Terbit",
    "Kutipan",
    "Perspektif Kritik",
    "Anotasi/Kritik",
    "Pertanyaan Refleksi",
    "Jawaban Refleksi",
    "Waktu Submit",
    "Jumlah Pesan AI",
  ];
  const csv = [
    csvLine(header),
    ...rows.map((row) =>
      csvLine([
        row.student.name,
        row.student.programStudy,
        row.student.university,
        row.story.title,
        row.story.mediaSource.name,
        formatMonth(row.story.publicationMonth),
        row.annotation?.quoteText,
        row.annotation ? perspectiveLabel(row.annotation.perspective) : "",
        row.annotation?.critiqueText,
        row.reflection?.promptText,
        row.reflection?.answerText,
        formatDateTime(row.latestAt),
        row.aiMessageCount,
      ]),
    ),
  ].join("\n");

  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kritisa-jawaban-${todayStamp()}.csv"`,
    },
  });
}
