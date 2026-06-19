import { pgTable, text } from "drizzle-orm/pg-core";

export const mediaSources = pgTable("media_sources", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  websiteUrl: text("website_url").notNull().default(""),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("mahasiswa"),
  programStudy: text("program_study").notNull().default(""),
  university: text("university").notNull().default(""),
  chatQuotaUsed: text("chat_quota_used").notNull().default("0"),
  chatQuotaResetAt: text("chat_quota_reset_at").notNull().default(""),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const stories = pgTable("stories", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  author: text("author").notNull().default(""),
  mediaSourceId: text("media_source_id")
    .notNull()
    .references(() => mediaSources.id),
  publishedAt: text("published_at").notNull().default(""),
  publicationMonth: text("publication_month").notNull(),
  sourceUrl: text("source_url").notNull().default(""),
  coverImageUrl: text("cover_image_url").notNull().default(""),
  summary: text("summary").notNull().default(""),
  content: text("content").notNull(),
  status: text("status").notNull().default("draft"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const readingSessions = pgTable("reading_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  storyId: text("story_id")
    .notNull()
    .references(() => stories.id),
  startedAt: text("started_at").notNull().default(""),
  completedAt: text("completed_at").notNull().default(""),
  lastStep: text("last_step").notNull().default("reading"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const annotations = pgTable("annotations", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  storyId: text("story_id")
    .notNull()
    .references(() => stories.id),
  readingSessionId: text("reading_session_id")
    .notNull()
    .references(() => readingSessions.id),
  quoteText: text("quote_text").notNull(),
  critiqueText: text("critique_text").notNull(),
  perspective: text("perspective").notNull().default("general"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const reflections = pgTable("reflections", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  storyId: text("story_id")
    .notNull()
    .references(() => stories.id),
  readingSessionId: text("reading_session_id")
    .notNull()
    .references(() => readingSessions.id),
  promptText: text("prompt_text").notNull(),
  answerText: text("answer_text").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const aiConversations = pgTable("ai_conversations", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  storyId: text("story_id")
    .notNull()
    .references(() => stories.id),
  readingSessionId: text("reading_session_id")
    .notNull()
    .references(() => readingSessions.id),
  annotationId: text("annotation_id").notNull().default(""),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const aiMessages = pgTable("ai_messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => aiConversations.id),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull(),
});
