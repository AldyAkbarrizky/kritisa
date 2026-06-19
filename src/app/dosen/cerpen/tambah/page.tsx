import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard-shell";
import { StoryForm } from "@/components/story-form";
import { requireAuth } from "@/lib/auth";
import { getMediaSources } from "@/lib/storage";
import { firstSearchValue } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tambah Cerpen",
};

export default async function CreateStoryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  if (!(await requireAuth("dosen"))) notFound();
  const [mediaSources, query] = await Promise.all([getMediaSources(), searchParams]);

  return (
    <DashboardShell title="Tambah Cerpen" description="Masukkan cerita, metadata, dan status publish.">
      <StoryForm mediaSources={mediaSources} error={firstSearchValue(query.error)} />
    </DashboardShell>
  );
}
