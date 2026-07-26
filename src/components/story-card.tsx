import Link from "next/link";
import { Badge, Card } from "@/components/ui";
import type { StoryWithMedia } from "@/lib/types";
import { formatPublishDate, truncate } from "@/lib/utils";

function hashColor(text: string) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = ((hash % 60) + 200) % 360;
  return `hsl(${hue}, 45%, 92%)`;
}

/**
 * Mobile: baris ringkas — thumbnail 84px di kiri, teks di kanan (~165px tinggi).
 * sm ke atas: kartu vertikal dengan sampul lebar seperti semula.
 * Seluruh kartu jadi satu target sentuh, jadi tombol terpisah tak diperlukan.
 */
export function StoryCard({ story }: { story: StoryWithMedia }) {
  const cover = story.coverImageUrl;

  return (
    <Card
      padded={false}
      className="h-full overflow-hidden border-l-4 border-l-accent transition hover:border-l-accent-strong hover:shadow-md"
    >
      <Link
        href={`/cerpen/${story.slug}`}
        className="flex h-full gap-3 p-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:flex-col sm:gap-0 sm:p-0"
      >
        {cover ? (
          <div
            role="img"
            aria-label={story.title}
            className="w-24 min-h-28 shrink-0 rounded-md bg-cover bg-center sm:aspect-[2/1] sm:min-h-0 sm:w-full sm:rounded-none"
            style={{ backgroundImage: `url("${cover}")` }}
          />
        ) : (
          <div
            className="flex w-24 min-h-28 shrink-0 items-center justify-center rounded-md sm:aspect-[2/1] sm:min-h-0 sm:w-full sm:rounded-none"
            style={{ backgroundColor: hashColor(story.title) }}
          >
            <span className="font-serif text-2xl font-bold leading-none text-primary/30 sm:text-5xl">
              {story.title.charAt(0)}
            </span>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:gap-2 sm:p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="primary">{story.mediaSource.name}</Badge>
            {/* Tanggal jadi teks biasa di mobile: dua badge berdampingan
                memakan satu baris penuh di kolom selebar ~200px. */}
            <span className="text-xs text-muted sm:hidden">
              {formatPublishDate(story.publishedAt, story.publicationMonth)}
            </span>
            <span className="hidden sm:inline">
              <Badge tone="accent">
                {formatPublishDate(story.publishedAt, story.publicationMonth)}
              </Badge>
            </span>
          </div>

          <h2 className="line-clamp-2 text-base font-bold leading-snug text-foreground sm:line-clamp-none sm:text-xl">
            {story.title}
          </h2>

          <p className="truncate text-xs font-medium text-muted sm:text-sm">
            {story.author || "Penulis tidak disebutkan"}
          </p>

          <p className="line-clamp-2 text-xs leading-5 text-muted sm:line-clamp-3 sm:text-sm sm:leading-6">
            {truncate(story.summary, 180)}
          </p>

          <span className="mt-auto hidden pt-1 text-sm font-semibold text-primary sm:inline-block">
            Baca cerpen →
          </span>
        </div>
      </Link>
    </Card>
  );
}
