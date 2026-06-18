import { buildAiMessages, buildReflectionPrompt } from "@/lib/ai/prompts";
import type { AiMessage, Annotation, StoryWithMedia } from "@/lib/types";

type AiResult =
  | { ok: true; content: string }
  | { ok: false; message: string };

type OpenAiMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

function getAiConfig() {
  const provider = process.env.AI_PROVIDER?.trim() || "groq";
  const apiKey = process.env.AI_API_KEY?.trim();
  const model = process.env.AI_MODEL?.trim() || "llama-3.1-8b-instant";
  const baseUrl =
    process.env.AI_BASE_URL?.trim() ||
    (provider === "groq" ? "https://api.groq.com/openai/v1" : "https://api.openai.com/v1");

  return { provider, apiKey, model, baseUrl };
}

async function requestChatCompletion(messages: OpenAiMessage[]): Promise<AiResult> {
  const config = getAiConfig();

  if (!config.apiKey) {
    return {
      ok: false,
      message:
        "AI belum dikonfigurasi. Isi AI_PROVIDER, AI_API_KEY, AI_BASE_URL, dan AI_MODEL di environment.",
    };
  }

  try {
    const response = await fetch(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: 0.6,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      return {
        ok: false,
        message:
          response.status === 429
            ? "AI sedang mencapai batas penggunaan free tier."
            : "AI sedang tidak tersedia.",
      };
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return { ok: false, message: "AI tidak mengirim tanggapan yang dapat dibaca." };
    }

    return { ok: true, content };
  } catch {
    return { ok: false, message: "AI sedang tidak tersedia." };
  }
}

export async function generateAiReply(input: {
  story: StoryWithMedia;
  quoteText?: string;
  annotation?: Annotation | null;
  history: AiMessage[];
  message: string;
}) {
  return requestChatCompletion(buildAiMessages(input) as OpenAiMessage[]);
}

export async function generateReflectionPrompt(input: {
  story: StoryWithMedia;
  quoteText?: string;
  annotationText?: string;
}) {
  const result = await requestChatCompletion([
    {
      role: "system",
      content:
        "Kamu membuat pertanyaan refleksi singkat dalam Bahasa Indonesia. Berikan satu pertanyaan saja.",
    },
    { role: "user", content: buildReflectionPrompt(input) },
  ]);

  if (!result.ok) {
    return result;
  }

  return {
    ok: true as const,
    content: result.content
      .replace(/^["']|["']$/g, "")
      .replace(/^Pertanyaan:\s*/i, "")
      .trim(),
  };
}
