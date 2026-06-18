import { NextRequest, NextResponse } from "next/server";
import { generateAiReply } from "@/lib/ai/client";
import type { Annotation } from "@/lib/types";
import { getCurrentStudent } from "@/lib/session";
import {
  addAiMessage,
  getConversationMessages,
  getLatestAnnotation,
  getOrCreateAiConversation,
  getStoryBySlug,
} from "@/lib/storage";
import { validateAiMessage } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const lastRequestByStudent = new Map<string, number>();

function error(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: { message } }, { status });
}

export async function POST(request: NextRequest) {
  const student = await getCurrentStudent();
  if (!student) {
    return error("Identitas mahasiswa belum diisi.", 401);
  }

  const now = Date.now();
  const previousRequest = lastRequestByStudent.get(student.id) ?? 0;
  if (now - previousRequest < 3000) {
    return error("Tunggu sebentar sebelum mengirim pesan berikutnya.", 429);
  }
  lastRequestByStudent.set(student.id, now);

  let body: {
    storySlug?: string;
    quoteText?: string;
    annotationId?: string;
    conversationId?: string;
    message?: unknown;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return error("Format permintaan tidak valid.");
  }

  const parsedMessage = validateAiMessage(body.message);
  if (!parsedMessage.ok) {
    return error(parsedMessage.message);
  }

  const story = body.storySlug ? await getStoryBySlug(body.storySlug) : null;
  if (!story) {
    return error("Cerpen tidak ditemukan.", 404);
  }

  const annotation = await getLatestAnnotation(student.id, story.id);
  const conversation = await getOrCreateAiConversation({
    studentId: student.id,
    storyId: story.id,
    annotationId: body.annotationId || annotation?.id,
  });
  const history = await getConversationMessages(conversation.id);

  await addAiMessage({
    conversationId: conversation.id,
    role: "student",
    content: parsedMessage.data,
  });

  const aiResult = await generateAiReply({
    story,
    quoteText: body.quoteText || annotation?.quoteText,
    annotation: annotation as Annotation | null,
    history,
    message: parsedMessage.data,
  });

  if (!aiResult.ok) {
    return error(
      `${aiResult.message} Kamu tetap bisa melanjutkan anotasi dan refleksi secara manual.`,
      503,
    );
  }

  await addAiMessage({
    conversationId: conversation.id,
    role: "assistant",
    content: aiResult.content,
  });

  return NextResponse.json({
    ok: true,
    data: {
      reply: aiResult.content,
      conversationId: conversation.id,
    },
  });
}
