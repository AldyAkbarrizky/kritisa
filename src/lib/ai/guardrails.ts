import type { AiMessage, Annotation, StoryWithMedia } from "@/lib/types";

type GuardrailResult =
  | { allowed: true }
  | { allowed: false; reply: string };

const scopeKeywords = [
  "cerpen",
  "cerita",
  "teks",
  "kutipan",
  "paragraf",
  "kalimat",
  "anotasi",
  "kritik",
  "kritisi",
  "analisis",
  "menganalisis",
  "interpretasi",
  "bukti",
  "gagasan",
  "tema",
  "tokoh",
  "karakter",
  "penokohan",
  "watak",
  "alur",
  "plot",
  "konflik",
  "latar",
  "setting",
  "sudut pandang",
  "narator",
  "simbol",
  "metafora",
  "gaya bahasa",
  "diksi",
  "amanat",
  "pesan",
  "makna",
  "struktural",
  "nonstruktural",
  "non struktural",
  "sosial",
  "budaya",
  "moral",
  "ideologi",
  "kelas",
  "ekonomi",
  "gender",
  "keluarga",
  "masyarakat",
  "pertanyaan kritis",
  "refleksi",
  "sastra",
  "unsur sastra",
  "perspektif",
  "berpikir kritis",
  "kehidupan nyata",
];

const continuationKeywords = [
  "lanjut",
  "jelaskan",
  "lebih dalam",
  "perjelas",
  "contoh",
  "bukti",
  "kenapa",
  "mengapa",
  "bagaimana",
  "maksudnya",
  "apa maksud",
  "apa makna",
  "dari sisi",
  "hubungannya",
  "kaitannya",
  "bagian mana",
  "setuju",
  "tidak setuju",
];

const contextualReferenceKeywords = [
  "cerpen ini",
  "cerita ini",
  "teks ini",
  "kutipan ini",
  "bagian ini",
  "paragraf ini",
  "kalimat ini",
  "tokoh ini",
  "konflik ini",
  "tema ini",
  "makna ini",
  "simbol ini",
  "latar ini",
  "alur ini",
  "gagasan ini",
  "persoalan ini",
  "isu ini",
];

const finalAnswerPatterns = [
  "jawaban final",
  "jawaban akhir",
  "jawaban siap",
  "siap dikumpulkan",
  "siap kumpul",
  "langsung kumpulkan",
  "buatkan jawaban",
  "tuliskan jawaban",
  "kerjakan tugas",
  "buatkan esai",
  "buat esai",
  "buatkan makalah",
  "buat makalah",
];

const systemProbePatterns = [
  "abaikan instruksi",
  "abaikan aturan",
  "ignore previous",
  "ignore instruction",
  "system prompt",
  "developer message",
  "prompt rahasia",
  "instruksi sistem",
  "api key",
  "apikey",
  "password",
  "token rahasia",
  "admin credential",
  "kredensial",
  "jailbreak",
];

const hardOutOfScopeKeywords = [
  "coding",
  "javascript",
  "python",
  "programming",
  "debug",
  "database",
  "sql",
  "resep",
  "masak",
  "cuaca",
  "saham",
  "crypto",
  "bitcoin",
  "trading",
  "harga emas",
  "diagnosis",
  "obat",
  "dosis",
  "diet",
  "game",
  "lirik",
  "matematika",
  "fisika",
  "kimia",
];

const unrelatedKeywords = [
  "kesehatan",
  "olahraga",
  "film",
  "lagu",
  "politik",
  "pemilu",
  "berita hari ini",
  "pacar",
  "curhat",
];

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function includesAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(normalize(keyword)));
}

function wordCount(text: string) {
  return text.split(/\s+/).filter(Boolean).length;
}

function getLastAssistantMessage(history: AiMessage[]) {
  return history.findLast((message) => message.role === "assistant") ?? null;
}

export function isAiGuardReply(value: string) {
  const text = normalize(value);

  return (
    text.startsWith("aku hanya bisa membantu") ||
    text.startsWith("aku bisa membantu brainstorming") ||
    text.startsWith("aku tidak bisa membahas") ||
    text.startsWith("saya hanya bisa membantu") ||
    text.startsWith("saya bisa membantu brainstorming") ||
    text.startsWith("saya tidak bisa membahas")
  );
}

function mentionsStoryTitle(text: string, storyTitle: string) {
  const titleWords = normalize(storyTitle)
    .split(/\s+/)
    .filter((word) => word.length >= 4);

  return titleWords.some((word) => text.includes(word));
}

function buildScopeReply(storyTitle: string) {
  return `Saya hanya bisa membantu diskusi tentang cerpen "${storyTitle}": kutipan, anotasi, tokoh, tema, alur, konflik, latar, makna sosial, atau pertanyaan kritis. Coba kaitkan pertanyaan Anda dengan cerpen yang sedang Anda baca.`;
}

function buildFinalAnswerReply(storyTitle: string) {
  return `Saya bisa membantu brainstorming, tetapi tidak menuliskan jawaban final siap dikumpulkan. Untuk cerpen "${storyTitle}", kirimkan ide awal Anda atau bagian yang ingin Anda analisis, lalu kita kembangkan dengan bukti dari teks.`;
}

function buildSystemProbeReply(storyTitle: string) {
  return `Saya tidak bisa membahas instruksi sistem, kredensial, atau permintaan teknis. Di sini saya hanya membantu diskusi tentang cerpen "${storyTitle}" dan cara membaca buktinya.`;
}

export function checkAiDiscussionScope(input: {
  message: string;
  story: StoryWithMedia;
  quoteText?: string;
  annotation?: Annotation | null;
  history: AiMessage[];
}): GuardrailResult {
  const text = normalize(input.message);

  if (includesAny(text, systemProbePatterns)) {
    return { allowed: false, reply: buildSystemProbeReply(input.story.title) };
  }

  if (includesAny(text, finalAnswerPatterns)) {
    return { allowed: false, reply: buildFinalAnswerReply(input.story.title) };
  }

  if (includesAny(text, hardOutOfScopeKeywords)) {
    return { allowed: false, reply: buildScopeReply(input.story.title) };
  }

  const hasScopeSignal =
    includesAny(text, scopeKeywords) ||
    mentionsStoryTitle(text, input.story.title) ||
    (input.quoteText ? includesAny(text, contextualReferenceKeywords) : false) ||
    Boolean(input.annotation && includesAny(text, ["anotasi", "kritik saya", "tulisan saya"]));

  const lastAssistantMessage = getLastAssistantMessage(input.history);
  const isContextualFollowUp =
    Boolean(lastAssistantMessage && !isAiGuardReply(lastAssistantMessage.content)) &&
    wordCount(text) <= 12 &&
    includesAny(text, continuationKeywords);

  if (hasScopeSignal || isContextualFollowUp) {
    return { allowed: true };
  }

  if (includesAny(text, unrelatedKeywords)) {
    return { allowed: false, reply: buildScopeReply(input.story.title) };
  }

  return { allowed: false, reply: buildScopeReply(input.story.title) };
}
