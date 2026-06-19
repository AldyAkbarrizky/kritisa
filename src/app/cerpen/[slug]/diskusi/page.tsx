import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChatInterface } from "@/components/chat-interface";
import { StudentHeader } from "@/components/student-header";
import {
  Badge,
  ButtonLink,
  Card,
  EmptyState,
  PageIntro,
} from "@/components/ui";
import { buildAiChatQuota } from "@/lib/ai/limits";
import { getCurrentStudent } from "@/lib/session";
import {
  countStudentAiChatMessages,
  getLatestAnnotation,
  getStoryBySlug,
} from "@/lib/storage";
import { firstSearchValue, formatMonth } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Diskusi AI",
};

export default async function AiDiscussionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [{ slug }, query, student] = await Promise.all([
    params,
    searchParams,
    getCurrentStudent(),
  ]);
  const story = await getStoryBySlug(slug);

  if (!story) {
    notFound();
  }

  const annotation = student
    ? await getLatestAnnotation(student.id, story.id)
    : null;
  const aiChatUsage = student
    ? await countStudentAiChatMessages(student.id, story.id)
    : 0;
  const aiChatQuota = buildAiChatQuota(aiChatUsage);
  const quoteText =
    firstSearchValue(query.quote) ?? "";

  return (
    <div className="min-h-screen bg-background">
      <StudentHeader />
      <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-12">
        <PageIntro
          eyebrow={story.title}
          title="Diskusi dengan Kritisa AI"
          description="Diskusikan kutipan pilihan Anda bersama Kritisa AI. Jelajahi makna, temukan perspektif baru, dan kembangkan pemikiran kritis melalui dialog."
        />

        {!student ? (
          <EmptyState
            title="Identitas belum diisi"
            description="Masuk sebagai mahasiswa sebelum berdiskusi dengan AI."
            action={
              <ButtonLink
                href={`/masuk?next=${encodeURIComponent(`/cerpen/${story.slug}/diskusi`)}`}
                fullWidth
              >
                Masuk sebagai Mahasiswa
              </ButtonLink>
            }
          />
        ) : (
          <>
            <Card className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge tone="primary">{story.mediaSource.name}</Badge>
                <Badge tone="accent">
                  {formatMonth(story.publicationMonth)}
                </Badge>
              </div>
              <p className="text-sm leading-6 text-muted">{story.summary}</p>
              {quoteText ? (
                <blockquote className="rounded-lg border-l-4 border-accent bg-accent-soft px-4 py-3 text-sm leading-6 text-foreground">
                  {quoteText}
                </blockquote>
              ) : null}
            </Card>
            <ChatInterface
              storySlug={story.slug}
              quoteText={quoteText}
              annotationId={annotation?.id}
              studentName={student.name}
              initialQuota={aiChatQuota}
            />
            <ButtonLink
              href={`/cerpen/${story.slug}/refleksi`}
              variant="secondary"
              fullWidth
            >
              Lanjut ke Refleksi
            </ButtonLink>
          </>
        )}
      </main>
    </div>
  );
}
