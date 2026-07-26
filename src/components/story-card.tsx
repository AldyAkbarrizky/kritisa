import { Badge, ButtonLink, Card } from "@/components/ui";
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

export function StoryCard({ story }: { story: StoryWithMedia }) {
  return (
    <Card className="flex h-full flex-col space-y-4 overflow-hidden border-l-4 border-l-accent p-0">
      {story.coverImageUrl ? (
        <div
          role="img"
          aria-label={story.title}
          className="aspect-[2/1] w-full bg-cover bg-center"
          style={{ backgroundImage: `url("${story.coverImageUrl}")` }}
        />
      ) : (
        <div
          className="flex aspect-[2/1] w-full items-center justify-center"
          style={{ backgroundColor: hashColor(story.title) }}
        >
          <span className="font-serif text-3xl font-bold leading-none text-primary/30 sm:text-5xl">
            {story.title.charAt(0)}
          </span>
        </div>
      )}
      <div className="flex flex-1 flex-col gap-3 p-4 pt-0">
        <div className="flex flex-wrap gap-2">
          <Badge tone="primary">{story.mediaSource.name}</Badge>
          <Badge tone="accent">
            {formatPublishDate(story.publishedAt, story.publicationMonth)}
          </Badge>
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-bold leading-snug text-foreground sm:text-xl">
            {story.title}
          </h2>
          <p className="text-xs font-medium text-muted sm:text-sm">
            {story.author || "Penulis tidak disebutkan"}
          </p>
          <p className="line-clamp-3 text-sm leading-6 text-muted">
            {truncate(story.summary, 180)}
          </p>
        </div>
        <ButtonLink href={`/cerpen/${story.slug}`} fullWidth className="mt-auto">
          Baca Cerpen
        </ButtonLink>
      </div>
    </Card>
  );
}
