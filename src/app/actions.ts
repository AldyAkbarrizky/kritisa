"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { quoteFallbackMessage, selectRandomQuote } from "@/lib/quote";
import {
  createStory,
  deleteOrArchiveStory,
  getMediaSources,
  getOrCreateReadingSession,
  getStoryById,
  getStoryBySlug,
  saveAnnotation,
  saveReflection,
  setStoryStatus,
  updateStory,
  upsertStudentIdentity,
} from "@/lib/storage";
import {
  clearAdminSession,
  createAdminSession,
  getCurrentStudent,
  getCurrentStudentId,
  requireAdminSession,
  setStudentSession,
  verifyAdminCredentials,
} from "@/lib/session";
import { sanitizeText, safeInternalPath } from "@/lib/utils";
import {
  validateAnnotation,
  validateReflection,
  validateStory,
  validateStudentIdentity,
} from "@/lib/validation";

function withQuery(path: string, key: string, value: string) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${key}=${encodeURIComponent(value)}`;
}

function storyFormPath(formData: FormData, fallback: string) {
  return sanitizeText(formData.get("returnPath")) || fallback;
}

export async function saveStudentIdentityAction(formData: FormData) {
  const next = safeInternalPath(sanitizeText(formData.get("next")), "/cerpen");
  const parsed = validateStudentIdentity(formData);

  if (!parsed.ok) {
    redirect(
      withQuery(
        `/masuk?next=${encodeURIComponent(next)}`,
        "error",
        parsed.message,
      ),
    );
  }

  const student = await upsertStudentIdentity(
    await getCurrentStudentId(),
    parsed.data,
  );
  await setStudentSession(student.id);
  revalidatePath("/cerpen");
  redirect(next);
}

export async function selectQuoteAction(formData: FormData) {
  const slug = sanitizeText(formData.get("slug"));
  const student = await getCurrentStudent();

  if (!student) {
    redirect(`/masuk?next=${encodeURIComponent(`/cerpen/${slug}`)}`);
  }

  const story = await getStoryBySlug(slug);
  if (!story) {
    redirect("/cerpen");
  }

  await getOrCreateReadingSession(student.id, story.id, "annotation");
  const quote = selectRandomQuote(story.content);
  if (!quote) {
    redirect(withQuery(`/cerpen/${story.slug}`, "error", quoteFallbackMessage));
  }

  redirect(`/cerpen/${story.slug}/kritik?quote=${encodeURIComponent(quote)}`);
}

export async function saveAnnotationAction(formData: FormData) {
  const slug = sanitizeText(formData.get("slug"));
  const quoteText = sanitizeText(formData.get("quoteText"));
  const basePath = `/cerpen/${slug}/kritik?quote=${encodeURIComponent(quoteText)}`;
  const student = await getCurrentStudent();

  if (!student) {
    redirect(`/masuk?next=${encodeURIComponent(`/cerpen/${slug}/kritik`)}`);
  }

  const story = await getStoryBySlug(slug);
  if (!story) {
    redirect("/cerpen");
  }

  const parsed = validateAnnotation(formData);
  if (!parsed.ok) {
    redirect(withQuery(basePath, "error", parsed.message));
  }

  await saveAnnotation({
    studentId: student.id,
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
  const student = await getCurrentStudent();

  if (!student) {
    redirect(`/masuk?next=${encodeURIComponent(basePath)}`);
  }

  const story = await getStoryBySlug(slug);
  if (!story) {
    redirect("/cerpen");
  }

  const parsed = validateReflection(formData);
  if (!parsed.ok) {
    redirect(withQuery(basePath, "error", parsed.message));
  }

  await saveReflection({
    studentId: student.id,
    storyId: story.id,
    promptText: parsed.data.promptText,
    answerText: parsed.data.answerText,
  });

  revalidatePath("/selesai");
  redirect(`/selesai?story=${encodeURIComponent(story.slug)}`);
}

export async function adminLoginAction(formData: FormData) {
  const username = sanitizeText(formData.get("username"));
  const password = String(formData.get("password") ?? "");
  const next = safeInternalPath(
    sanitizeText(formData.get("next")),
    "/dosen/dashboard",
  );
  const result = verifyAdminCredentials(username, password);

  if (!result.ok) {
    redirect(
      withQuery(
        `/dosen/login?next=${encodeURIComponent(next)}`,
        "error",
        result.message,
      ),
    );
  }

  try {
    await createAdminSession();
  } catch (error) {
    redirect(
      withQuery(
        `/dosen/login?next=${encodeURIComponent(next)}`,
        "error",
        error instanceof Error ? error.message : "Sesi dosen gagal dibuat.",
      ),
    );
  }

  redirect(next);
}

export async function adminLogoutAction() {
  await clearAdminSession();
  redirect("/dosen/login");
}

async function assertStoryMedia(mediaSourceId: string, returnPath: string) {
  const mediaSources = await getMediaSources();
  if (!mediaSources.some((source) => source.id === mediaSourceId)) {
    redirect(withQuery(returnPath, "error", "Media sumber tidak ditemukan."));
  }
}

export async function createStoryAction(formData: FormData) {
  await requireAdminSession();
  const returnPath = storyFormPath(formData, "/dosen/cerpen/tambah");
  const parsed = validateStory(formData);

  if (!parsed.ok) {
    redirect(withQuery(returnPath, "error", parsed.message));
  }

  await assertStoryMedia(parsed.data.mediaSourceId, returnPath);
  const story = await createStory({
    ...parsed.data,
    publishedAt:
      parsed.data.publishedAt || `${parsed.data.publicationMonth}-01`,
  });


  if (!story) {
    redirect(withQuery(returnPath, "error", "Gagal membuat cerpen."));
  }

  revalidatePath("/cerpen");
  revalidatePath("/dosen/cerpen");
  redirect(`/dosen/cerpen/${story.id}/edit?saved=1`);
}

export async function updateStoryAction(formData: FormData) {
  await requireAdminSession();
  const id = sanitizeText(formData.get("id"));
  const returnPath = storyFormPath(formData, `/dosen/cerpen/${id}/edit`);
  const parsed = validateStory(formData);

  if (!parsed.ok) {
    redirect(withQuery(returnPath, "error", parsed.message));
  }

  await assertStoryMedia(parsed.data.mediaSourceId, returnPath);
  const story = await updateStory(id, {
    ...parsed.data,
    publishedAt:
      parsed.data.publishedAt || `${parsed.data.publicationMonth}-01`,
  });

  if (!story) {
    redirect(withQuery("/dosen/cerpen", "error", "Cerpen tidak ditemukan."));
  }

  revalidatePath("/cerpen");
  revalidatePath(`/cerpen/${story.slug}`);
  revalidatePath("/dosen/cerpen");
  redirect(`/dosen/cerpen/${story.id}/edit?saved=1`);
}

export async function setStoryStatusAction(formData: FormData) {
  await requireAdminSession();
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
  await requireAdminSession();
  const id = sanitizeText(formData.get("id"));
  const story = await getStoryById(id);
  await deleteOrArchiveStory(id);

  if (story) {
    revalidatePath(`/cerpen/${story.slug}`);
  }

  revalidatePath("/cerpen");
  revalidatePath("/dosen/cerpen");
  redirect("/dosen/cerpen?saved=1");
}

// ── Media Source Actions ──

import {
  createMediaSource,
  updateMediaSource,
  deleteMediaSource,
} from "@/lib/storage";

export async function createMediaSourceAction(formData: FormData) {
  await requireAdminSession();
  const name = sanitizeText(formData.get("name"));
  const slug = sanitizeText(formData.get("slug"));
  const websiteUrl = sanitizeText(formData.get("websiteUrl"));

  if (!name || name.length < 2) {
    redirect("/dosen/media/tambah?error=Nama+media+wajib+diisi.");
  }

  await createMediaSource({ name, slug, websiteUrl });
  revalidatePath("/dosen/media");
  redirect("/dosen/media?saved=1");
}

export async function updateMediaSourceAction(formData: FormData) {
  await requireAdminSession();
  const id = sanitizeText(formData.get("id"));
  const name = sanitizeText(formData.get("name"));
  const slug = sanitizeText(formData.get("slug"));
  const websiteUrl = sanitizeText(formData.get("websiteUrl"));

  if (!name || name.length < 2) {
    redirect(`/dosen/media/${id}/edit?error=Nama+media+wajib+diisi.`);
  }

  await updateMediaSource(id, { name, slug, websiteUrl });
  revalidatePath("/dosen/media");
  redirect("/dosen/media?saved=1");
}

export async function deleteMediaSourceAction(formData: FormData) {
  await requireAdminSession();
  const id = sanitizeText(formData.get("id"));
  await deleteMediaSource(id);
  revalidatePath("/dosen/media");
  redirect("/dosen/media?saved=1");
}
