import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { StoryForm } from "@/components/story-form";
import { requireAdminSession } from "@/lib/session";
import { getMediaSources, getStoryById } from "@/lib/storage";
import { firstSearchValue } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit Cerpen",
};

export default async function EditStoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireAdminSession();
  const [{ id }, query, mediaSources] = await Promise.all([
    params,
    searchParams,
    getMediaSources(),
  ]);
  const story = await getStoryById(id);

  if (!story) {
    notFound();
  }

  return (
    <DashboardShell title="Edit Cerpen" description="Perbarui metadata, isi, dan status cerpen.">
      <StoryForm
        mediaSources={mediaSources}
        story={story}
        error={firstSearchValue(query.error)}
        saved={firstSearchValue(query.saved) === "1"}
      />
    </DashboardShell>
  );
}
