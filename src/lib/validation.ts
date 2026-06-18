import { sanitizeLongText, sanitizeText, slugify } from "@/lib/utils";
import type { Perspective, StoryStatus } from "@/lib/types";

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };

function lengthBetween(value: string, min: number, max: number) {
  return value.length >= min && value.length <= max;
}

function validOptionalUrl(value: string) {
  if (!value) {
    return true;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateStudentIdentity(formData: FormData): ValidationResult<{
  name: string;
  programStudy: string;
  university: string;
}> {
  const name = sanitizeText(formData.get("name"));
  const programStudy = sanitizeText(formData.get("programStudy"));
  const university = sanitizeText(formData.get("university"));

  if (!lengthBetween(name, 2, 100)) {
    return { ok: false, message: "Nama wajib diisi 2-100 karakter." };
  }

  if (!lengthBetween(programStudy, 2, 120)) {
    return { ok: false, message: "Program studi wajib diisi 2-120 karakter." };
  }

  if (!lengthBetween(university, 2, 150)) {
    return { ok: false, message: "Universitas wajib diisi 2-150 karakter." };
  }

  return { ok: true, data: { name, programStudy, university } };
}

export function validateAnnotation(formData: FormData): ValidationResult<{
  quoteText: string;
  critiqueText: string;
  perspective: Perspective;
}> {
  const quoteText = sanitizeLongText(formData.get("quoteText"));
  const critiqueText = sanitizeLongText(formData.get("critiqueText"));
  const perspectiveValue = sanitizeText(formData.get("perspective"));
  const perspective: Perspective =
    perspectiveValue === "structural" || perspectiveValue === "non_structural"
      ? perspectiveValue
      : "general";

  if (!lengthBetween(quoteText, 12, 1200)) {
    return { ok: false, message: "Kutipan belum tersedia atau terlalu pendek." };
  }

  if (!lengthBetween(critiqueText, 20, 3000)) {
    return { ok: false, message: "Kritik wajib diisi minimal 20 karakter." };
  }

  return { ok: true, data: { quoteText, critiqueText, perspective } };
}

export function validateReflection(formData: FormData): ValidationResult<{
  promptText: string;
  answerText: string;
}> {
  const promptText = sanitizeLongText(formData.get("promptText"));
  const answerText = sanitizeLongText(formData.get("answerText"));

  if (!lengthBetween(promptText, 10, 700)) {
    return { ok: false, message: "Pertanyaan refleksi belum tersedia." };
  }

  if (!lengthBetween(answerText, 20, 3000)) {
    return { ok: false, message: "Refleksi wajib diisi minimal 20 karakter." };
  }

  return { ok: true, data: { promptText, answerText } };
}

export function validateAiMessage(value: unknown): ValidationResult<string> {
  const message = sanitizeLongText(typeof value === "string" ? value : "");

  if (!lengthBetween(message, 2, 1000)) {
    return { ok: false, message: "Pesan diskusi wajib diisi 2-1000 karakter." };
  }

  return { ok: true, data: message };
}

export function validateStory(formData: FormData): ValidationResult<{
  title: string;
  slug: string;
  author: string;
  mediaSourceId: string;
  publishedAt: string;
  publicationMonth: string;
  sourceUrl: string;
  coverImageUrl: string;
  summary: string;
  content: string;
  status: StoryStatus;
}> {
  const title = sanitizeText(formData.get("title"));
  const requestedSlug = sanitizeText(formData.get("slug"));
  const slug = requestedSlug ? slugify(requestedSlug) : slugify(title);
  const author = sanitizeText(formData.get("author"));
  const mediaSourceId = sanitizeText(formData.get("mediaSourceId"));
  const publishedAt = sanitizeText(formData.get("publishedAt"));
  const publicationMonth = sanitizeText(formData.get("publicationMonth"));
  const sourceUrl = sanitizeText(formData.get("sourceUrl"));
  const coverImageUrl = sanitizeText(formData.get("coverImageUrl"));
  const summary = sanitizeLongText(formData.get("summary"));
  const content = sanitizeLongText(formData.get("content"));
  const statusValue = sanitizeText(formData.get("status"));
  const status: StoryStatus = statusValue === "published" ? "published" : "draft";

  if (!lengthBetween(title, 3, 200)) {
    return { ok: false, message: "Judul wajib diisi 3-200 karakter." };
  }

  if (!slug) {
    return { ok: false, message: "Slug tidak valid." };
  }

  if (!mediaSourceId) {
    return { ok: false, message: "Media sumber wajib dipilih." };
  }

  if (!/^\d{4}-\d{2}$/.test(publicationMonth)) {
    return { ok: false, message: "Bulan terbit wajib memakai format YYYY-MM." };
  }

  if (sourceUrl && !validOptionalUrl(sourceUrl)) {
    return { ok: false, message: "URL sumber tidak valid." };
  }

  if (coverImageUrl && !validOptionalUrl(coverImageUrl)) {
    return { ok: false, message: "URL gambar tidak valid." };
  }

  if (!lengthBetween(summary, 20, 600)) {
    return { ok: false, message: "Ringkasan wajib diisi 20-600 karakter." };
  }

  if (!lengthBetween(content, 80, 20000)) {
    return { ok: false, message: "Isi cerpen wajib diisi minimal 80 karakter." };
  }

  return {
    ok: true,
    data: {
      title,
      slug,
      author,
      mediaSourceId,
      publishedAt,
      publicationMonth,
      sourceUrl,
      coverImageUrl,
      summary,
      content,
      status,
    },
  };
}
