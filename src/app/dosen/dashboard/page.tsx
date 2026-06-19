import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard-shell";
import { Badge, ButtonLink, Card, EmptyState } from "@/components/ui";
import { requireAuth } from "@/lib/auth";
import { getDashboardSummary } from "@/lib/storage";
import { formatDateTime, truncate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard Dosen",
};

export default async function LecturerDashboardPage() {
  if (!(await requireAuth("dosen"))) notFound();
  const summary = await getDashboardSummary();
  const stats = [
    { label: "Cerpen Published", value: summary.publishedStories },
    { label: "Total Cerpen", value: summary.totalStories },
    { label: "Mahasiswa", value: summary.students },
    { label: "Kritik", value: summary.annotations },
    { label: "Refleksi", value: summary.reflections },
  ];

  return (
    <DashboardShell
      title="Ringkasan Aktivitas"
      description="Pantau cerpen, identitas mahasiswa, kritik, refleksi, dan jawaban terbaru."
    >
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <p className="text-sm font-semibold text-muted">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-foreground">
              {stat.value}
            </p>
          </Card>
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-bold text-foreground">Jawaban Terbaru</h2>
          <ButtonLink href="/dosen/jawaban" variant="secondary">
            Lihat Semua Jawaban
          </ButtonLink>
        </div>
        {summary.recentAnswers.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {summary.recentAnswers.map((row) => (
              <Card key={row.session.id} className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge tone={row.reflection ? "success" : "accent"}>
                    {row.reflection ? "Refleksi" : "Kritik"}
                  </Badge>
                  <Badge tone="primary">{row.story.mediaSource.name}</Badge>
                </div>
                <div>
                  <h3 className="font-bold text-foreground">
                    {row.student.name}
                  </h3>
                  <p className="text-sm text-muted">
                    {row.student.programStudy} · {row.student.university}
                  </p>
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {row.story.title}
                </p>
                <p className="text-sm leading-6 text-muted">
                  {truncate(
                    row.reflection?.answerText ||
                      row.annotation?.critiqueText ||
                      "",
                    160,
                  )}
                </p>
                <p className="text-xs font-semibold text-muted">
                  {formatDateTime(row.latestAt)}
                </p>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState title="Belum ada jawaban mahasiswa." />
        )}
      </section>
    </DashboardShell>
  );
}
