export type StoryStatus = "draft" | "published";
export type Perspective = "structural" | "non_structural" | "general";
export type ReadingStep =
  | "reading"
  | "annotation"
  | "ai_discussion"
  | "reflection"
  | "completed";
export type AiRole = "student" | "assistant" | "system";

export type MediaSource = {
  id: string;
  name: string;
  slug: string;
  websiteUrl: string;
  createdAt: string;
  updatedAt: string;
};

export type Story = {
  id: string;
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
  createdAt: string;
  updatedAt: string;
};

export type Student = {
  id: string;
  name: string;
  programStudy: string;
  university: string;
  createdAt: string;
  updatedAt: string;
};

export type ReadingSession = {
  id: string;
  studentId: string;
  storyId: string;
  startedAt: string;
  completedAt: string;
  lastStep: ReadingStep;
  createdAt: string;
  updatedAt: string;
};

export type Annotation = {
  id: string;
  studentId: string;
  storyId: string;
  readingSessionId: string;
  quoteText: string;
  critiqueText: string;
  perspective: string;
  createdAt: string;
  updatedAt: string;
};

export type Reflection = {
  id: string;
  studentId: string;
  storyId: string;
  readingSessionId: string;
  promptText: string;
  answerText: string;
  createdAt: string;
  updatedAt: string;
};

export type AiConversation = {
  id: string;
  studentId: string;
  storyId: string;
  readingSessionId: string;
  annotationId: string;
  createdAt: string;
  updatedAt: string;
};

export type AiMessage = {
  id: string;
  conversationId: string;
  role: AiRole;
  content: string;
  createdAt: string;
};

export type Database = {
  mediaSources: MediaSource[];
  stories: Story[];
  students: Student[];
  readingSessions: ReadingSession[];
  annotations: Annotation[];
  reflections: Reflection[];
  aiConversations: AiConversation[];
  aiMessages: AiMessage[];
};

export type StoryWithMedia = Story & {
  mediaSource: MediaSource;
};

export type AnswerRow = {
  session: ReadingSession;
  student: Student;
  story: StoryWithMedia;
  annotation?: Annotation;
  reflection?: Reflection;
  aiMessageCount: number;
  latestAt: string;
};
