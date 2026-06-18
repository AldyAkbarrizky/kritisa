import { Badge, ButtonLink, Card } from "@/components/ui";
import type { StoryWithMedia } from "@/lib/types";
import { formatMonth, truncate } from "@/lib/utils";

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
    <Card className="space-y-4 overflow-hidden border-l-4 border-l-accent p-0">
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
          <span className="font-serif text-5xl font-bold leading-none text-primary/30">
            {story.title.charAt(0)}
          </span>
        </div>
      )}
      <div className="space-y-4 p-4 pt-0">
        <div className="flex flex-wrap gap-2">
          <Badge tone="primary">{story.mediaSource.name}</Badge>
          <Badge tone="accent">{formatMonth(story.publicationMonth)}</Badge>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold leading-tight text-foreground">
            {story.title}
          </h2>
          <p className="text-sm font-medium text-muted">
            {story.author || "Penulis tidak disebutkan"}
          </p>
          <p className="text-sm leading-6 text-muted">
            {truncate(story.summary, 180)}
          </p>
        </div>
        <ButtonLink href={`/cerpen/${story.slug}`} fullWidth>
          Baca Cerpen
        </ButtonLink>
      </div>
    </Card>
  );
}
