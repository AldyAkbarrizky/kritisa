import { eq, and, desc, asc, count, gte } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { seedDefaultUsers } from "@/lib/auth";
import { nowIso, makeId, slugify } from "@/lib/utils";
import type {
  MediaSource,
  User,
  StoryWithMedia,
  StoryStatus,
  ReadingSession,
  ReadingStep,
  Annotation,
  Reflection,
  AiConversation,
  AiMessage,
  AnswerRow,
} from "@/lib/types";

const {
  mediaSources,
  users,
  stories,
  readingSessions,
  annotations,
  reflections,
  aiConversations,
  aiMessages,
} = schema;

// ── Media Sources ──

export async function getMediaSources(): Promise<MediaSource[]> {
  await seedDefaultUsers();
  return db
    .select()
    .from(mediaSources)
    .orderBy(asc(mediaSources.name)) as unknown as MediaSource[];
}

export async function getMediaSourceById(
  id: string,
): Promise<MediaSource | null> {
  const rows = await db
    .select()
    .from(mediaSources)
    .where(eq(mediaSources.id, id));
  return (rows[0] ?? null) as MediaSource | null;
}

export async function createMediaSource(input: {
  name: string;
  slug: string;
  websiteUrl: string;
}) {
  const id = makeId("media");
  const now = nowIso();
  const uniqueSlug = await ensureUniqueSourceSlug(
    input.slug || slugify(input.name),
  );
  await db.insert(mediaSources).values({
    id,
    name: input.name,
    slug: uniqueSlug,
    websiteUrl: input.websiteUrl,
    createdAt: now,
    updatedAt: now,
  });
  return {
    id,
    name: input.name,
    slug: uniqueSlug,
    websiteUrl: input.websiteUrl,
    createdAt: now,
    updatedAt: now,
  } as MediaSource;
}

export async function updateMediaSource(
  id: string,
  input: { name: string; slug: string; websiteUrl: string },
) {
  await db
    .update(mediaSources)
    .set({
      name: input.name,
      slug: input.slug || slugify(input.name),
      websiteUrl: input.websiteUrl,
      updatedAt: nowIso(),
    })
    .where(eq(mediaSources.id, id));
  return getMediaSourceById(id);
}

export async function deleteMediaSource(id: string) {
  await db.delete(mediaSources).where(eq(mediaSources.id, id));
}

async function ensureUniqueSourceSlug(
  preferred: string,
  ignoreId?: string,
): Promise<string> {
  const base = slugify(preferred) || "media";
  let candidate = base;
  let idx = 2;
  while (true) {
    const existing = await db
      .select()
      .from(mediaSources)
      .where(eq(mediaSources.slug, candidate));
    if (
      existing.filter((s) => (ignoreId ? s.id !== ignoreId : true)).length === 0
    )
      return candidate;
    candidate = `${base}-${idx++}`;
  }
}

// ── Users ──

export async function getUserById(id: string): Promise<User | null> {
  const rows = await db.select().from(users).where(eq(users.id, id));
  return (rows[0] ?? null) as User | null;
}

export async function listUsers(role?: string): Promise<User[]> {
  if (role)
    return db
      .select()
      .from(users)
      .where(eq(users.role, role))
      .orderBy(asc(users.name)) as unknown as User[];
  return db.select().from(users).orderBy(asc(users.name)) as unknown as User[];
}

export async function updateUser(
  id: string,
  input: {
    name: string;
    programStudy: string;
    university: string;
    role?: string;
  },
) {
  const data: Record<string, string> = {
    name: input.name,
    programStudy: input.programStudy,
    university: input.university,
    updatedAt: nowIso(),
  };
  if (input.role) data.role = input.role;
  await db
    .update(users)
    .set(data as typeof users.$inferInsert)
    .where(eq(users.id, id));
  return getUserById(id);
}

export async function deleteUser(id: string) {
  await db.delete(users).where(eq(users.id, id));
}

// ── Stories ──

async function withMediaSource(
  s: typeof stories.$inferSelect,
): Promise<StoryWithMedia> {
  const src = await getMediaSourceById(s.mediaSourceId);
  return {
    id: s.id,
    title: s.title,
    slug: s.slug,
    author: s.author,
    mediaSourceId: s.mediaSourceId,
    publishedAt: s.publishedAt,
    publicationMonth: s.publicationMonth,
    sourceUrl: s.sourceUrl,
    coverImageUrl: s.coverImageUrl,
    summary: s.summary,
    content: s.content,
    status: s.status as StoryStatus,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    mediaSource: src ?? {
      id: s.mediaSourceId,
      name: "Media tidak diketahui",
      slug: "unknown",
      websiteUrl: "",
      createdAt: "",
      updatedAt: "",
    },
  };
}

export async function listStories(filters?: {
  status?: StoryStatus | "all";
  media?: string;
  month?: string;
  search?: string;
}): Promise<StoryWithMedia[]> {
  const conds: ReturnType<typeof eq>[] = [];
  if (!filters?.status || filters.status === "published")
    conds.push(eq(stories.status, "published"));
  else if (filters.status !== "all")
    conds.push(eq(stories.status, filters.status));
  if (filters?.media) conds.push(eq(mediaSources.slug, filters.media));
  if (filters?.month) conds.push(eq(stories.publicationMonth, filters.month));

  const qb = db
    .select()
    .from(stories)
    .innerJoin(mediaSources, eq(stories.mediaSourceId, mediaSources.id))
    .where(and(...conds));
  const rows = await qb.orderBy(desc(stories.publishedAt), asc(stories.title));
  let result = rows.map((r) => r.stories);
  if (filters?.search) {
    const term = filters.search.toLowerCase();
    result = result.filter(
      (s) =>
        s.title.toLowerCase().includes(term) ||
        s.author.toLowerCase().includes(term) ||
        s.summary.toLowerCase().includes(term),
    );
  }
  return Promise.all(result.map((r) => withMediaSource(r)));
}

export async function listPublicationMonths(
  status: StoryStatus | "all" = "published",
) {
  const s = await listStories({ status });
  return [...new Set(s.map((st) => st.publicationMonth))].sort().reverse();
}

export async function getStoryBySlug(
  slug: string,
): Promise<StoryWithMedia | null> {
  const rows = await db.select().from(stories).where(eq(stories.slug, slug));
  return rows[0] ? withMediaSource(rows[0]) : null;
}

export async function getStoryById(id: string): Promise<StoryWithMedia | null> {
  const rows = await db.select().from(stories).where(eq(stories.id, id));
  return rows[0] ? withMediaSource(rows[0]) : null;
}

export async function createStory(input: Record<string, string>) {
  const id = makeId("story");
  const now = nowIso();
  await db.insert(stories).values({
    id,
    title: input.title,
    slug: input.slug,
    author: input.author,
    mediaSourceId: input.mediaSourceId,
    publishedAt: input.publishedAt,
    publicationMonth: input.publicationMonth,
    sourceUrl: input.sourceUrl,
    coverImageUrl: input.coverImageUrl,
    summary: input.summary,
    content: input.content,
    status: input.status,
    createdAt: now,
    updatedAt: now,
  });
  return getStoryById(id);
}

export async function updateStory(id: string, input: Record<string, string>) {
  await db
    .update(stories)
    .set({ ...input, updatedAt: nowIso() })
    .where(eq(stories.id, id));
  return getStoryById(id);
}

export async function setStoryStatus(id: string, status: StoryStatus) {
  await db
    .update(stories)
    .set({ status, updatedAt: nowIso() })
    .where(eq(stories.id, id));
  return getStoryById(id);
}

export async function deleteOrArchiveStory(id: string) {
  const rows = await db
    .select({ count: count() })
    .from(readingSessions)
    .where(eq(readingSessions.storyId, id));
  if (Number(rows[0].count) > 0) {
    await setStoryStatus(id, "draft");
    return "archived" as const;
  }
  await db.delete(stories).where(eq(stories.id, id));
  return "deleted" as const;
}

// ── Reading Sessions ──

export async function getOrCreateReadingSession(
  userId: string,
  storyId: string,
  lastStep: ReadingStep = "reading",
): Promise<ReadingSession> {
  const now = nowIso();
  const rows = await db
    .select()
    .from(readingSessions)
    .where(
      and(
        eq(readingSessions.userId, userId),
        eq(readingSessions.storyId, storyId),
      ),
    )
    .orderBy(desc(readingSessions.createdAt))
    .limit(1);
  if (rows[0]) {
    await db
      .update(readingSessions)
      .set({ lastStep, updatedAt: now })
      .where(eq(readingSessions.id, rows[0].id));
    return rows[0] as ReadingSession;
  }
  const id = makeId("session");
  await db.insert(readingSessions).values({
    id,
    userId,
    storyId,
    startedAt: now,
    completedAt: "",
    lastStep,
    createdAt: now,
    updatedAt: now,
  });
  return {
    id,
    userId,
    storyId,
    startedAt: now,
    completedAt: "",
    lastStep,
    createdAt: now,
    updatedAt: now,
  };
}

// ── Annotations ──

export async function saveAnnotation(input: {
  userId: string;
  storyId: string;
  quoteText: string;
  critiqueText: string;
  perspective: string;
}): Promise<Annotation> {
  const session = await getOrCreateReadingSession(
    input.userId,
    input.storyId,
    "annotation",
  );
  const id = makeId("annotation");
  const now = nowIso();
  await db.insert(annotations).values({
    id,
    userId: input.userId,
    storyId: input.storyId,
    readingSessionId: session.id,
    quoteText: input.quoteText,
    critiqueText: input.critiqueText,
    perspective: input.perspective,
    createdAt: now,
    updatedAt: now,
  });
  return {
    id,
    ...input,
    readingSessionId: session.id,
    createdAt: now,
    updatedAt: now,
  };
}

export async function getLatestAnnotation(
  userId: string | null,
  storyId: string,
): Promise<Annotation | null> {
  if (!userId) return null;
  const rows = await db
    .select()
    .from(annotations)
    .where(
      and(eq(annotations.userId, userId), eq(annotations.storyId, storyId)),
    )
    .orderBy(desc(annotations.createdAt))
    .limit(1);
  return (rows[0] ?? null) as Annotation | null;
}

// ── Reflections ──

export async function saveReflection(input: {
  userId: string;
  storyId: string;
  promptText: string;
  answerText: string;
}): Promise<Reflection> {
  const session = await getOrCreateReadingSession(
    input.userId,
    input.storyId,
    "completed",
  );
  const id = makeId("reflection");
  const now = nowIso();
  await db.insert(reflections).values({
    id,
    userId: input.userId,
    storyId: input.storyId,
    readingSessionId: session.id,
    promptText: input.promptText,
    answerText: input.answerText,
    createdAt: now,
    updatedAt: now,
  });
  await db
    .update(readingSessions)
    .set({ lastStep: "completed", completedAt: now, updatedAt: now })
    .where(eq(readingSessions.id, session.id));
  return {
    id,
    ...input,
    readingSessionId: session.id,
    createdAt: now,
    updatedAt: now,
  };
}

export async function getLatestReflection(
  userId: string | null,
  storyId: string,
): Promise<Reflection | null> {
  if (!userId) return null;
  const rows = await db
    .select()
    .from(reflections)
    .where(
      and(eq(reflections.userId, userId), eq(reflections.storyId, storyId)),
    )
    .orderBy(desc(reflections.createdAt))
    .limit(1);
  return (rows[0] ?? null) as Reflection | null;
}

// ── AI Chat ──

export async function getOrCreateAiConversation(input: {
  userId: string;
  storyId: string;
  annotationId?: string;
}): Promise<AiConversation> {
  await getOrCreateReadingSession(input.userId, input.storyId, "ai_discussion");
  const rows = await db
    .select()
    .from(aiConversations)
    .where(
      and(
        eq(aiConversations.userId, input.userId),
        eq(aiConversations.storyId, input.storyId),
      ),
    )
    .orderBy(desc(aiConversations.createdAt))
    .limit(1);
  if (rows[0]) return rows[0] as AiConversation;
  const id = makeId("conversation");
  const now = nowIso();
  const session = await getOrCreateReadingSession(input.userId, input.storyId);
  await db.insert(aiConversations).values({
    id,
    userId: input.userId,
    storyId: input.storyId,
    readingSessionId: session.id,
    annotationId: input.annotationId ?? "",
    createdAt: now,
    updatedAt: now,
  });
  const created = await db
    .select()
    .from(aiConversations)
    .where(eq(aiConversations.id, id));
  return created[0] as AiConversation;
}

export async function addAiMessage(input: {
  conversationId: string;
  role: string;
  content: string;
}) {
  const id = makeId("msg");
  const now = nowIso();
  await db.insert(aiMessages).values({
    id,
    conversationId: input.conversationId,
    role: input.role,
    content: input.content,
    createdAt: now,
  });
  await db
    .update(aiConversations)
    .set({ updatedAt: now })
    .where(eq(aiConversations.id, input.conversationId));
  return { id, ...input, createdAt: now };
}

export async function getConversationMessages(
  conversationId: string,
): Promise<AiMessage[]> {
  return db
    .select()
    .from(aiMessages)
    .where(eq(aiMessages.conversationId, conversationId))
    .orderBy(asc(aiMessages.createdAt)) as unknown as AiMessage[];
}

export async function countUserAiChatMessages(
  userId: string,
  storyId: string,
): Promise<number> {
  const rows = await db
    .select({ count: count() })
    .from(aiMessages)
    .innerJoin(
      aiConversations,
      eq(aiMessages.conversationId, aiConversations.id),
    )
    .where(
      and(
        eq(aiConversations.userId, userId),
        eq(aiConversations.storyId, storyId),
      ),
    );
  return Number(rows[0].count);
}

export async function countUserChatMessagesToday(
  userId: string,
): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString();
  const user = await getUserById(userId);
  const since =
    user?.chatQuotaResetAt && user.chatQuotaResetAt > todayIso
      ? user.chatQuotaResetAt
      : todayIso;
  const rows = await db
    .select({ count: count() })
    .from(aiMessages)
    .innerJoin(
      aiConversations,
      eq(aiMessages.conversationId, aiConversations.id),
    )
    .where(
      and(
        eq(aiConversations.userId, userId),
        eq(aiMessages.role, "student"),
        gte(aiMessages.createdAt, since),
      ),
    );
  return Number(rows[0].count);
}

export async function resetStudentChatQuota(userId: string) {
  const now = nowIso();
  await db
    .update(users)
    .set({ chatQuotaUsed: "0", chatQuotaResetAt: now, updatedAt: now })
    .where(eq(users.id, userId));
}

export async function getStudentMessagesForConversation(
  conversationId: string,
): Promise<string[]> {
  const rows = await db
    .select({ content: aiMessages.content })
    .from(aiMessages)
    .where(
      and(
        eq(aiMessages.conversationId, conversationId),
        eq(aiMessages.role, "student"),
      ),
    )
    .orderBy(asc(aiMessages.createdAt));
  return rows.map((r) => r.content);
}

export async function getLatestAiConversation(
  userId: string,
  storyId: string,
): Promise<AiConversation | null> {
  const rows = await db
    .select()
    .from(aiConversations)
    .where(
      and(
        eq(aiConversations.userId, userId),
        eq(aiConversations.storyId, storyId),
      ),
    )
    .orderBy(desc(aiConversations.createdAt))
    .limit(1);
  return (rows[0] ?? null) as AiConversation | null;
}

// ── Answers ──

export async function listAnswerRows(filters?: {
  storyId?: string;
  mediaSourceId?: string;
}): Promise<AnswerRow[]> {
  const conds: ReturnType<typeof eq>[] = [];
  if (filters?.storyId)
    conds.push(eq(readingSessions.storyId, filters.storyId));
  if (filters?.mediaSourceId)
    conds.push(eq(stories.mediaSourceId, filters.mediaSourceId));

  const q = db
    .select({ session: readingSessions, student: users, story: stories })
    .from(readingSessions)
    .innerJoin(users, eq(readingSessions.userId, users.id))
    .innerJoin(stories, eq(readingSessions.storyId, stories.id))
    .where(conds.length > 0 ? and(...conds) : undefined)
    .orderBy(desc(readingSessions.updatedAt));

  const rows = await q;
  const result: AnswerRow[] = [];

  for (const row of rows) {
    const [ann, ref] = await Promise.all([
      db
        .select()
        .from(annotations)
        .where(eq(annotations.readingSessionId, row.session.id))
        .orderBy(desc(annotations.createdAt))
        .limit(1),
      db
        .select()
        .from(reflections)
        .where(eq(reflections.readingSessionId, row.session.id))
        .orderBy(desc(reflections.createdAt))
        .limit(1),
    ]);
    const aiCount = await db
      .select({ count: count() })
      .from(aiMessages)
      .innerJoin(
        aiConversations,
        eq(aiMessages.conversationId, aiConversations.id),
      )
      .where(eq(aiConversations.readingSessionId, row.session.id));
    if (!ann[0] && !ref[0] && Number(aiCount[0].count) === 0) continue;
    result.push({
      session: row.session as ReadingSession,
      student: row.student as User,
      story: await withMediaSource(row.story),
      annotation: ann[0] as Annotation | undefined,
      reflection: ref[0] as Reflection | undefined,
      aiMessageCount: Number(aiCount[0].count),
      latestAt:
        row.session.updatedAt || ann[0]?.createdAt || ref[0]?.createdAt || "",
    });
  }
  return result;
}

export async function getDashboardSummary() {
  const [pub, tot, stud, ann, ref, recent] = await Promise.all([
    db
      .select({ count: count() })
      .from(stories)
      .where(eq(stories.status, "published")),
    db.select({ count: count() }).from(stories),
    db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, "mahasiswa")),
    db.select({ count: count() }).from(annotations),
    db.select({ count: count() }).from(reflections),
    listAnswerRows(),
  ]);
  return {
    publishedStories: Number(pub[0].count),
    totalStories: Number(tot[0].count),
    students: Number(stud[0].count),
    annotations: Number(ann[0].count),
    reflections: Number(ref[0].count),
    recentAnswers: recent.slice(0, 6),
  };
}
