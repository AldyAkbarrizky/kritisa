import { cn } from "@/lib/utils";

type PageItem =
  | { kind: "page"; n: number; active: boolean }
  | { kind: "ellipsis"; id: "left" | "right" };

function buildPageList(current: number, total: number): PageItem[] {
  if (total <= 1) return [];
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => ({
      kind: "page" as const,
      n: i + 1,
      active: i + 1 === current,
    }));
  }

  const items: PageItem[] = [];
  const last = total;
  const window = 1;

  const showLeftEllipsis = current - window > 2;
  const showRightEllipsis = current + window < last - 1;

  items.push({ kind: "page", n: 1, active: current === 1 });

  const start = Math.max(2, current - window);
  const end = Math.min(last - 1, current + window);

  if (showLeftEllipsis) {
    items.push({ kind: "ellipsis", id: "left" });
  } else {
    for (let n = 2; n < start; n++) {
      items.push({ kind: "page", n, active: false });
    }
  }

  for (let n = start; n <= end; n++) {
    items.push({ kind: "page", n, active: n === current });
  }

  if (showRightEllipsis) {
    items.push({ kind: "ellipsis", id: "right" });
  } else {
    for (let n = end + 1; n < last; n++) {
      items.push({ kind: "page", n, active: false });
    }
  }

  if (last > 1) {
    items.push({ kind: "page", n: last, active: current === last });
  }

  return items;
}

function pageHref(n: number, base: Record<string, string>) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(base)) {
    if (v) params.set(k, v);
  }
  params.set("page", String(n));
  return `/cerpen?${params.toString()}`;
}

export function Pagination({
  page,
  totalPages,
  baseParams,
}: {
  page: number;
  totalPages: number;
  baseParams: { media: string; month: string; search: string };
}) {
  const items = buildPageList(page, totalPages);
  const baseClass =
    "inline-flex min-h-10 min-w-10 items-center justify-center rounded-md border px-3 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
  const activeClass = "border-primary bg-primary text-primary-foreground";
  const idleClass =
    "border-border bg-surface text-foreground hover:bg-surface-muted";
  const disabledClass =
    "border-border bg-surface text-muted opacity-50 cursor-not-allowed";

  return (
    <nav
      aria-label="Navigasi halaman"
      className="flex flex-wrap items-center justify-center gap-1.5 pt-4"
    >
      {page > 1 ? (
        <a
          href={pageHref(page - 1, baseParams)}
          rel="prev"
          className={cn(baseClass, idleClass)}
        >
          ←
          <span className="ml-1 hidden sm:inline">Sebelumnya</span>
        </a>
      ) : (
        <span aria-disabled className={cn(baseClass, disabledClass)}>
          ←
          <span className="ml-1 hidden sm:inline">Sebelumnya</span>
        </span>
      )}

      {items.map((item, idx) => {
        if (item.kind === "ellipsis") {
          return (
            <span
              key={`${item.id}-${idx}`}
              className="inline-flex min-h-10 min-w-10 items-center justify-center text-sm text-muted"
              aria-hidden
            >
              …
            </span>
          );
        }
        if (item.active) {
          return (
            <span
              key={`p-${item.n}`}
              aria-current="page"
              className={cn(baseClass, activeClass)}
            >
              {item.n}
            </span>
          );
        }
        return (
          <a
            key={`p-${item.n}`}
            href={pageHref(item.n, baseParams)}
            aria-label={`Halaman ${item.n}`}
            className={cn(baseClass, idleClass)}
          >
            {item.n}
          </a>
        );
      })}

      {page < totalPages ? (
        <a
          href={pageHref(page + 1, baseParams)}
          rel="next"
          className={cn(baseClass, idleClass)}
        >
          <span className="mr-1 hidden sm:inline">Selanjutnya</span>
          →
        </a>
      ) : (
        <span aria-disabled className={cn(baseClass, disabledClass)}>
          <span className="mr-1 hidden sm:inline">Selanjutnya</span>
          →
        </span>
      )}
    </nav>
  );
}
