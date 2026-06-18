import type { Metadata } from "next";
import Link from "next/link";
import { deleteStoryAction, setStoryStatusAction } from "@/app/actions";
import { DashboardShell } from "@/components/dashboard-shell";
import { FormSubmit } from "@/components/form-submit";
import {
  Badge,
  ButtonLink,
  Card,
  EmptyState,
  ErrorBanner,
  SuccessBanner,
} from "@/components/ui";
import { requireAdminSession } from "@/lib/session";
import { listStories } from "@/lib/storage";
import { firstSearchValue, formatMonth, truncate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kelola Cerpen",
};

export default async function LecturerStoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireAdminSession();
  const query = await searchParams;
  const stories = await listStories({ status: "all" });
  const error = firstSearchValue(query.error);
  const saved = firstSearchValue(query.saved) === "1";

  return (
    <DashboardShell
      title="Kelola Cerpen"
      description="Tambah, edit, publish, unpublish, atau arsipkan cerpen."
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <ErrorBanner message={error} />
          <SuccessBanner
            message={saved ? "Perubahan cerpen berhasil diproses." : null}
          />
        </div>
        <ButtonLink href="/dosen/cerpen/tambah">Tambah Cerpen</ButtonLink>
      </div>

      {stories.length > 0 ? (
        <div className="grid gap-4">
          {stories.map((story) => (
            <Card key={story.id} className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge
                  tone={story.status === "published" ? "success" : "neutral"}
                >
                  {story.status === "published" ? "Published" : "Draft"}
                </Badge>
                <Badge tone="primary">{story.mediaSource.name}</Badge>
                <Badge tone="accent">
                  {formatMonth(story.publicationMonth)}
                </Badge>
              </div>
              <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    {story.title}
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-muted">
                    {truncate(story.summary, 180)}
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row md:justify-end">
                  <Link
                    href={`/dosen/cerpen/${story.id}/edit`}
                    className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-surface-muted"
                  >
                    Edit
                  </Link>
                  <form action={setStoryStatusAction}>
                    <input type="hidden" name="id" value={story.id} />
                    <input
                      type="hidden"
                      name="status"
                      value={
                        story.status === "published" ? "draft" : "published"
                      }
                    />
                    <FormSubmit
                      variant="secondary"
                      fullWidth={false}
                      pendingLabel="Memproses..."
                    >
                      {story.status === "published" ? "Unpublish" : "Publish"}
                    </FormSubmit>
                  </form>
                  <form action={deleteStoryAction}>
                    <input type="hidden" name="id" value={story.id} />
                    <FormSubmit
                      variant="danger"
                      fullWidth={false}
                      pendingLabel="Menghapus..."
                    >
                      Hapus
                    </FormSubmit>
                  </form>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Belum ada cerpen."
          action={
            <ButtonLink href="/dosen/cerpen/tambah">Tambah Cerpen</ButtonLink>
          }
        />
      )}
    </DashboardShell>
  );
}
