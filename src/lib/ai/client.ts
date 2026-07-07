import {
  buildAiMessages,
  buildCerpenExtractionPrompt,
  buildReflectionDraftPrompt,
  buildReflectionPrompt,
  buildReflectionSummaryPrompt,
} from "@/lib/ai/prompts";
import type { AiMessage, Annotation, StoryWithMedia } from "@/lib/types";

type AiResult = { ok: true; content: string } | { ok: false; message: string };

type OpenAiMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

function normalizeAiContent(value: string) {
  return value
    .replace(/^```(?:markdown|md)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p>/gi, "\n\n")
    .replace(/<\/?p>/gi, "")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

function getAiConfig() {
  const provider = process.env.AI_PROVIDER?.trim() || "groq";
  const apiKey = process.env.AI_API_KEY?.trim();
  const model = process.env.AI_MODEL?.trim() || "llama-3.1-8b-instant";
  const baseUrl =
    process.env.AI_BASE_URL?.trim() ||
    (provider === "groq"
      ? "https://api.groq.com/openai/v1"
      : "https://api.openai.com/v1");

  return { provider, apiKey, model, baseUrl };
}

async function requestChatCompletion(
  messages: OpenAiMessage[],
  options?: { temperature?: number; maxTokens?: number; jsonMode?: boolean },
): Promise<AiResult> {
  const config = getAiConfig();

  if (!config.apiKey) {
    return {
      ok: false,
      message:
        "AI belum dikonfigurasi. Isi AI_PROVIDER, AI_API_KEY, AI_BASE_URL, dan AI_MODEL di environment.",
    };
  }

  try {
    const body: Record<string, unknown> = {
      model: config.model,
      messages,
      temperature: options?.temperature ?? 0.6,
      max_tokens: options?.maxTokens ?? 900,
    };
    if (options?.jsonMode) {
      body.response_format = { type: "json_object" };
    }

    const response = await fetch(
      `${config.baseUrl.replace(/\/$/, "")}/chat/completions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      let detail = "";
      try {
        const errBody = await response.text();
        detail = errBody.slice(0, 300);
      } catch {
        /* ignore */
      }
      return {
        ok: false,
        message:
          response.status === 429
            ? "AI sedang mencapai batas penggunaan free tier."
            : `AI tidak tersedia (HTTP ${response.status}${detail ? `: ${detail}` : ""})`,
      };
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return {
        ok: false,
        message: "AI tidak mengirim tanggapan yang dapat dibaca.",
      };
    }

    return { ok: true, content: normalizeAiContent(content) };
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      message: `AI tidak tersedia (${detail.slice(0, 200)})`,
    };
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
        "Anda membuat pertanyaan refleksi singkat dalam Bahasa Indonesia. Berikan satu pertanyaan saja.",
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

export async function generateReflectionDraft(input: {
  story: StoryWithMedia;
  quoteText?: string;
  annotationText?: string;
  studentMessages: string[];
}) {
  const result = await requestChatCompletion([
    {
      role: "system",
      content:
        "Anda membuat teks awal refleksi mahasiswa berdasarkan diskusi cerpen. Jangan menambah ide di luar input mahasiswa. Tulis Bahasa Indonesia, orang pertama, singkat, dan tetap bisa diedit mahasiswa. Jangan beri judul atau awalan seperti 'Draf Refleksi:'.",
    },
    { role: "user", content: buildReflectionDraftPrompt(input) },
  ]);

  if (!result.ok) {
    return result;
  }

  return {
    ok: true as const,
    content: result.content
      .replace(/^["']|["']$/g, "")
      .replace(/^#{1,6}\s*Draf Refleksi\s*:?\s*/i, "")
      .replace(/^Draf Refleksi\s*:?\s*/i, "")
      .trim(),
  };
}

export async function generateReflectionSummary(input: {
  story: StoryWithMedia;
  reflectionAnswer: string;
}) {
  const result = await requestChatCompletion([
    {
      role: "system",
      content:
        "Anda membuat ringkasan pemahaman singkat dalam Bahasa Indonesia berdasarkan jawaban refleksi mahasiswa. Gunakan format: 'Berdasarkan jawaban Anda, tampak bahwa Anda memahami cerpen ini sebagai cerita yang mengangkat persoalan [tema]. Anda menyoroti aspek [konflik/isu/nilai] serta menghubungkannya dengan [refleksi/makna]. Pemahaman ini menunjukkan kemampuan Anda dalam menafsirkan makna cerita dan merefleksikannya dalam konteks yang lebih luas.' Sesuaikan isi kurung siku dengan jawaban mahasiswa. Jangan lebih dari 3 kalimat.",
    },
    { role: "user", content: buildReflectionSummaryPrompt(input) },
  ]);

  if (!result.ok) return result;

  return {
    ok: true as const,
    content: result.content.replace(/^["']|["']$/g, "").trim(),
  };
}

export type ExtractedCerpen = {
  title: string;
  author: string;
  publishedAt: string;
  publicationMonth: string;
  sourceUrl: string;
  mediaName: string;
  summary: string;
  content: string;
};

export type ExtractResult =
  { ok: true; data: ExtractedCerpen } | { ok: false; message: string };

function asString(v: unknown): string {
  if (typeof v === "string") return v;
  if (v == null) return "";
  return String(v);
}

function clampSummary(value: string): string {
  if (value.length <= 180) return value;
  const trimmed = value.slice(0, 180);
  const lastSpace = trimmed.lastIndexOf(" ");
  return (lastSpace > 100 ? trimmed.slice(0, lastSpace) : trimmed) + "...";
}

function isISODate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

function isYearMonth(value: string): boolean {
  return (
    /^\d{4}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}-01`))
  );
}

function deriveMonth(date: string): string {
  return date.slice(0, 7);
}

export async function extractCerpenMetadata(
  rawText: string,
  storyContent: string,
): Promise<ExtractResult> {
  const trimmed = rawText.trim();
  if (trimmed.length < 80) {
    return {
      ok: false,
      message:
        "Teks dari file terlalu pendek. Pastikan file .docx berisi cerpen yang dapat dibaca.",
    };
  }

  // AI hanya ekstrak metadata — konten cerpen dari mammoth langsung
  const result = await requestChatCompletion(
    [
      {
        role: "system",
        content:
          "Anda adalah extractor metadata cerpen. Output HANYA JSON valid sesuai skema. Jangan menambahkan teks di luar JSON.",
      },
      { role: "user", content: buildCerpenExtractionPrompt(trimmed) },
    ],
    { temperature: 0.2, maxTokens: 1500 },
  );

  if (!result.ok) {
    return { ok: false, message: result.message };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(result.content);
  } catch {
    return {
      ok: false,
      message:
        "AI tidak mengembalikan JSON yang valid. Coba ulangi atau isi formulir secara manual.",
    };
  }

  if (!parsed || typeof parsed !== "object") {
    return { ok: false, message: "Format respons AI tidak dikenali." };
  }

  const obj = parsed as Record<string, unknown>;
  const title = asString(obj.title).trim();
  const author = asString(obj.author).trim();
  const publishedAtRaw = asString(obj.publishedAt).trim();
  const publicationMonthRaw = asString(obj.publicationMonth).trim();
  const sourceUrl = asString(obj.sourceUrl).trim();
  const mediaName = asString(obj.mediaName).trim();
  const summaryRaw = asString(obj.summary).trim();

  if (!title) {
    return {
      ok: false,
      message: "AI tidak berhasil menemukan judul cerpen.",
    };
  }

  let publishedAt = "";
  if (isISODate(publishedAtRaw)) publishedAt = publishedAtRaw;

  let publicationMonth = "";
  if (isYearMonth(publicationMonthRaw)) publicationMonth = publicationMonthRaw;
  if (!publicationMonth && publishedAt)
    publicationMonth = deriveMonth(publishedAt);

  const summary = clampSummary(
    summaryRaw || storyContent.slice(0, 180).replace(/\s+/g, " ").trim(),
  );

  let validSourceUrl = "";
  if (sourceUrl) {
    try {
      const u = new URL(sourceUrl);
      if (u.protocol === "http:" || u.protocol === "https:") {
        validSourceUrl = u.origin + u.pathname;
      }
    } catch {
      validSourceUrl = "";
    }
  }

  // Konten cerpen dari mammoth, bukan dari AI
  const normalizedContent = storyContent.replace(/\n{2,}/g, "\n");

  return {
    ok: true,
    data: {
      title,
      author,
      publishedAt,
      publicationMonth,
      sourceUrl: validSourceUrl,
      mediaName,
      summary,
      content: normalizedContent,
    },
  };
}
