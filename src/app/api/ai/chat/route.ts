import { NextRequest, NextResponse } from "next/server";
import { generateAiReply } from "@/lib/ai/client";
import { getCurrentUser } from "@/lib/auth";
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

const lastRequestByUser = new Map<string, number>();

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json(
      { ok: false, error: { message: "Silakan masuk terlebih dahulu." } },
      { status: 401 },
    );

  const now = Date.now();
  const prev = lastRequestByUser.get(user.id) ?? 0;
  if (now - prev < 3000)
    return NextResponse.json(
      {
        ok: false,
        error: {
          message: "Tunggu sebentar sebelum mengirim pesan berikutnya.",
        },
      },
      { status: 429 },
    );
  lastRequestByUser.set(user.id, now);

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
    return NextResponse.json(
      { ok: false, error: { message: "Format permintaan tidak valid." } },
      { status: 400 },
    );
  }

  const parsed = validateAiMessage(body.message);
  if (!parsed.ok)
    return NextResponse.json(
      { ok: false, error: { message: parsed.message } },
      { status: 400 },
    );

  const story = body.storySlug ? await getStoryBySlug(body.storySlug) : null;
  if (!story)
    return NextResponse.json(
      { ok: false, error: { message: "Cerpen tidak ditemukan." } },
      { status: 404 },
    );

  const annotation = await getLatestAnnotation(user.id, story.id);
  const conversation = await getOrCreateAiConversation({
    userId: user.id,
    storyId: story.id,
    annotationId: body.annotationId || annotation?.id,
  });
  const history = await getConversationMessages(conversation.id);

  await addAiMessage({
    conversationId: conversation.id,
    role: "student",
    content: parsed.data,
  });

  const aiResult = await generateAiReply({
    story,
    quoteText: body.quoteText || annotation?.quoteText,
    annotation,
    history,
    message: parsed.data,
  });

  if (!aiResult.ok)
    return NextResponse.json(
      {
        ok: false,
        error: {
          message: `${aiResult.message} Kamu tetap bisa melanjutkan anotasi dan refleksi secara manual.`,
        },
      },
      { status: 503 },
    );

  await addAiMessage({
    conversationId: conversation.id,
    role: "assistant",
    content: aiResult.content,
  });

  return NextResponse.json({
    ok: true,
    data: { reply: aiResult.content, conversationId: conversation.id },
  });
}
