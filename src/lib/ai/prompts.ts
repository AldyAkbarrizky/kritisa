import type { AiMessage, Annotation, StoryWithMedia } from "@/lib/types";
import { truncate } from "@/lib/utils";

export const aiSystemPrompt = `Kamu adalah asisten literasi kritis bernama Kritisa AI. Tugasmu membantu mahasiswa berdiskusi dan melakukan brainstorming saat membaca cerpen.

Gunakan Bahasa Indonesia yang jelas, ramah, dan akademis ringan. Jangan memberikan jawaban final yang langsung bisa dikumpulkan mahasiswa. Arahkan mahasiswa dengan pertanyaan pemantik, sudut pandang analisis, dan cara membaca bukti dari teks.

Bantu mahasiswa mengeksplorasi:
1. Analisis struktural: tema, tokoh, alur, konflik, latar, sudut pandang, simbol, gaya bahasa.
2. Analisis nonstruktural: konteks sosial, budaya, moral, ideologi, pengalaman pembaca, dan relevansi dengan kehidupan.

Jika konteks cerpen tidak cukup, katakan bahwa analisis masih perlu dibatasi pada kutipan/konteks yang tersedia. Jangan mengarang detail cerita.`;

export function buildAiMessages(input: {
  story: StoryWithMedia;
  quoteText?: string;
  annotation?: Annotation | null;
  history: AiMessage[];
  message: string;
}) {
  const context = [
    `Judul cerpen: ${input.story.title}`,
    `Penulis: ${input.story.author || "-"}`,
    `Media: ${input.story.mediaSource.name}`,
    `Ringkasan: ${input.story.summary}`,
    input.quoteText ? `Kutipan yang dikritisi: ${input.quoteText}` : "",
    input.annotation ? `Anotasi mahasiswa: ${input.annotation.critiqueText}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const recentHistory = input.history.slice(-6).map((message) => ({
    role: message.role === "assistant" ? "assistant" : "user",
    content: truncate(message.content, 900),
  }));

  return [
    { role: "system", content: aiSystemPrompt },
    {
      role: "user",
      content: `Konteks diskusi:\n${context}\n\nIngat: bantu brainstorming, jangan tuliskan jawaban final.`,
    },
    ...recentHistory,
    { role: "user", content: input.message },
  ];
}

export function buildReflectionPrompt(input: {
  story: StoryWithMedia;
  quoteText?: string;
  annotationText?: string;
}) {
  return `Buat satu pertanyaan refleksi singkat dalam Bahasa Indonesia untuk mahasiswa setelah membaca cerpen berikut. Pertanyaan harus mendorong mahasiswa menjelaskan pemahaman, sikap kritis, dan hal yang didapat dari cerpen. Jangan beri jawaban.

Judul: ${input.story.title}
Penulis: ${input.story.author || "-"}
Kutipan yang dikritik: ${input.quoteText || "-"}
Anotasi mahasiswa: ${input.annotationText || "-"}`;
}
