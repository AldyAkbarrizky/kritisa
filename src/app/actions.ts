"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  loginUser,
  registerUser,
  clearSession,
  createSession,
  hashPassword,
} from "@/lib/auth";
import { quoteFallbackMessage, selectRandomQuote } from "@/lib/quote";
import {
  createStory,
  createMediaSource,
  updateMediaSource,
  deleteMediaSource,
  getMediaSourceById,
  deleteOrArchiveStory,
  getMediaSources,
  getOrCreateReadingSession,
  getStoryById,
  getStoryBySlug,
  saveAnnotation,
  saveReflection,
  setStoryStatus,
  updateStory,
  updateUser,
  deleteUser,
  getUserById,
} from "@/lib/storage";
import { sanitizeText, safeInternalPath, nowIso } from "@/lib/utils";
import {
  validateAnnotation,
  validateReflection,
  validateStory,
} from "@/lib/validation";
import { getCurrentUser, requireAuth } from "@/lib/auth";

function withQuery(path: string, key: string, value: string) {
  return `${path}${path.includes("?") ? "&" : "?"}${key}=${encodeURIComponent(value)}`;
}

// ── Auth Actions ──

export async function registerAction(formData: FormData) {
  const email = sanitizeText(formData.get("email"));
  const name = sanitizeText(formData.get("name"));
  const password = String(formData.get("password") ?? "");
  const programStudy = sanitizeText(formData.get("programStudy"));
  const university = sanitizeText(formData.get("university"));

  if (!email || !name || !password || password.length < 6) {
    redirect(
      withQuery(
        "/daftar",
        "error",
        "Semua field wajib diisi. Kata sandi minimal 6 karakter.",
      ),
    );
  }

  const result = await registerUser({
    email,
    name,
    password,
    programStudy,
    university,
  });
  if (!result.ok) {
    redirect(withQuery("/daftar", "error", result.message!!));
  }

  await createSession(result.userId!, "mahasiswa");
  redirect("/cerpen");
}

export async function loginAction(formData: FormData) {
  const email = sanitizeText(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  const next = safeInternalPath(sanitizeText(formData.get("next")), "/cerpen");

  // Check if logging in as dosen
  const result = await loginUser(email, password);
  if (!result.ok) {
    redirect(
      withQuery(
        `/masuk?next=${encodeURIComponent(next)}`,
        "error",
        result.message,
      ),
    );
  }

  const user = result.user!;
  if (user.role === "dosen") {
    redirect("/dosen/dashboard");
  }

  redirect(next);
}

export async function logoutAction() {
  await clearSession();
  redirect("/masuk");
}

// ── Quote & Annotation ──

export async function selectQuoteAction(formData: FormData) {
  const slug = sanitizeText(formData.get("slug"));
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/masuk?next=${encodeURIComponent(`/cerpen/${slug}`)}`);
  }

  const story = await getStoryBySlug(slug);
  if (!story) redirect("/cerpen");

  await getOrCreateReadingSession(user.id, story.id, "annotation");
  const quote = selectRandomQuote(story.content);
  if (!quote)
    redirect(withQuery(`/cerpen/${story.slug}`, "error", quoteFallbackMessage));

  redirect(`/cerpen/${story.slug}/kritik?quote=${encodeURIComponent(quote)}`);
}

export async function saveAnnotationAction(formData: FormData) {
  const slug = sanitizeText(formData.get("slug"));
  const quoteText = sanitizeText(formData.get("quoteText"));
  const basePath = `/cerpen/${slug}/kritik?quote=${encodeURIComponent(quoteText)}`;
  const user = await getCurrentUser();

  if (!user)
    redirect(`/masuk?next=${encodeURIComponent(`/cerpen/${slug}/kritik`)}`);

  const story = await getStoryBySlug(slug);
  if (!story) redirect("/cerpen");

  const parsed = validateAnnotation(formData);
  if (!parsed.ok) redirect(withQuery(basePath, "error", parsed.message));

  await saveAnnotation({
    userId: user.id,
    storyId: story.id,
    quoteText: parsed.data.quoteText,
    critiqueText: parsed.data.critiqueText,
    perspective: parsed.data.perspective,
  });

  revalidatePath(`/cerpen/${story.slug}/kritik`);
  redirect(withQuery(basePath, "saved", "1"));
}

export async function saveReflectionAction(formData: FormData) {
  const slug = sanitizeText(formData.get("slug"));
  const basePath = `/cerpen/${slug}/refleksi`;
  const user = await getCurrentUser();
  if (!user) redirect(`/masuk?next=${encodeURIComponent(basePath)}`);

  const story = await getStoryBySlug(slug);
  if (!story) redirect("/cerpen");

  const parsed = validateReflection(formData);
  if (!parsed.ok) redirect(withQuery(basePath, "error", parsed.message));

  await saveReflection({
    userId: user.id,
    storyId: story.id,
    promptText: parsed.data.promptText,
    answerText: parsed.data.answerText,
  });

  redirect(`/selesai?story=${encodeURIComponent(story.slug)}`);
}

// ── Story Management ──

async function assertStoryMedia(mediaSourceId: string, returnPath: string) {
  const sources = await getMediaSources();
  if (!sources.some((s) => s.id === mediaSourceId))
    redirect(withQuery(returnPath, "error", "Media sumber tidak ditemukan."));
}

function storyFormPath(formData: FormData, fallback: string) {
  return sanitizeText(formData.get("returnPath")) || fallback;
}

export async function createStoryAction(formData: FormData) {
  await requireAuth("dosen");
  const returnPath = storyFormPath(formData, "/dosen/cerpen/tambah");
  const parsed = validateStory(formData);
  if (!parsed.ok) redirect(withQuery(returnPath, "error", parsed.message));
  await assertStoryMedia(parsed.data.mediaSourceId, returnPath);
  const story = await createStory({
    ...parsed.data,
    publishedAt:
      parsed.data.publishedAt || `${parsed.data.publicationMonth}-01`,
  });
  if (!story) redirect(withQuery(returnPath, "error", "Gagal membuat cerpen."));
  revalidatePath("/cerpen");
  revalidatePath("/dosen/cerpen");
  redirect(`/dosen/cerpen/${story.id}/edit?saved=1`);
}

export async function updateStoryAction(formData: FormData) {
  await requireAuth("dosen");
  const id = sanitizeText(formData.get("id"));
  const returnPath = storyFormPath(formData, `/dosen/cerpen/${id}/edit`);
  const parsed = validateStory(formData);
  if (!parsed.ok) redirect(withQuery(returnPath, "error", parsed.message));
  await assertStoryMedia(parsed.data.mediaSourceId, returnPath);
  const story = await updateStory(id, {
    ...parsed.data,
    publishedAt:
      parsed.data.publishedAt || `${parsed.data.publicationMonth}-01`,
  });
  if (!story)
    redirect(withQuery("/dosen/cerpen", "error", "Cerpen tidak ditemukan."));
  revalidatePath("/cerpen");
  revalidatePath(`/cerpen/${story.slug}`);
  revalidatePath("/dosen/cerpen");
  redirect(`/dosen/cerpen/${story.id}/edit?saved=1`);
}

export async function setStoryStatusAction(formData: FormData) {
  await requireAuth("dosen");
  const id = sanitizeText(formData.get("id"));
  const status =
    sanitizeText(formData.get("status")) === "published"
      ? "published"
      : "draft";
  const story = await setStoryStatus(id, status);
  if (story) {
    revalidatePath("/cerpen");
    revalidatePath(`/cerpen/${story.slug}`);
  }
  revalidatePath("/dosen/cerpen");
  redirect("/dosen/cerpen?saved=1");
}

export async function deleteStoryAction(formData: FormData) {
  await requireAuth("dosen");
  const id = sanitizeText(formData.get("id"));
  const story = await getStoryById(id);
  await deleteOrArchiveStory(id);
  if (story) revalidatePath(`/cerpen/${story.slug}`);
  revalidatePath("/cerpen");
  revalidatePath("/dosen/cerpen");
  redirect("/dosen/cerpen?saved=1");
}

// ── Media Source Management ──

export async function createMediaSourceAction(formData: FormData) {
  await requireAuth("dosen");
  const name = sanitizeText(formData.get("name"));
  const slug = sanitizeText(formData.get("slug"));
  const websiteUrl = sanitizeText(formData.get("websiteUrl"));
  if (!name || name.length < 2)
    redirect("/dosen/media/tambah?error=Nama+media+wajib+diisi.");
  await createMediaSource({ name, slug, websiteUrl });
  revalidatePath("/dosen/media");
  redirect("/dosen/media?saved=1");
}

export async function updateMediaSourceAction(formData: FormData) {
  await requireAuth("dosen");
  const id = sanitizeText(formData.get("id"));
  const name = sanitizeText(formData.get("name"));
  const slug = sanitizeText(formData.get("slug"));
  const websiteUrl = sanitizeText(formData.get("websiteUrl"));
  if (!name || name.length < 2)
    redirect(`/dosen/media/${id}/edit?error=Nama+media+wajib+diisi.`);
  await updateMediaSource(id, { name, slug, websiteUrl });
  revalidatePath("/dosen/media");
  redirect("/dosen/media?saved=1");
}

export async function deleteMediaSourceAction(formData: FormData) {
  await requireAuth("dosen");
  await deleteMediaSource(sanitizeText(formData.get("id")));
  revalidatePath("/dosen/media");
  redirect("/dosen/media?saved=1");
}

// ── User Management (Dosen only) ──

export async function createMahasiswaAction(formData: FormData) {
  await requireAuth("dosen");
  const email = sanitizeText(formData.get("email"));
  const name = sanitizeText(formData.get("name"));
  const password = String(formData.get("password") ?? "");
  const programStudy = sanitizeText(formData.get("programStudy"));
  const university = sanitizeText(formData.get("university"));
  if (!email || !name || !password)
    redirect("/dosen/mahasiswa/tambah?error=Semua+field+wajib+diisi.");
  const result = await registerUser({
    email,
    name,
    password,
    programStudy,
    university,
  });
  if (!result.ok)
    redirect(
      `/dosen/mahasiswa/tambah?error=${encodeURIComponent(result.message!)}`,
    );
  revalidatePath("/dosen/mahasiswa");
  redirect("/dosen/mahasiswa?saved=1");
}

export async function updateMahasiswaAction(formData: FormData) {
  await requireAuth("dosen");
  const id = sanitizeText(formData.get("id"));
  const name = sanitizeText(formData.get("name"));
  const programStudy = sanitizeText(formData.get("programStudy"));
  const university = sanitizeText(formData.get("university"));
  await updateUser(id, { name, programStudy, university });
  revalidatePath("/dosen/mahasiswa");
  redirect("/dosen/mahasiswa?saved=1");
}

export async function deleteMahasiswaAction(formData: FormData) {
  await requireAuth("dosen");
  await deleteUser(sanitizeText(formData.get("id")));
  revalidatePath("/dosen/mahasiswa");
  redirect("/dosen/mahasiswa?saved=1");
}


export async function resetPasswordAction(formData: FormData) {
  await requireAuth("dosen");
  const id = sanitizeText(formData.get("id"));
  const { db, schema } = await import("@/lib/db");
  const { eq } = await import("drizzle-orm");
  const h = await hashPassword("kritisa123");
  await db.update(schema.users).set({ passwordHash: h, updatedAt: nowIso() }).where(eq(schema.users.id, id));
  revalidatePath("/dosen/mahasiswa");
  redirect(`/dosen/mahasiswa/${id}/edit?msg=Password+direset+ke+kritisa123`);
}
