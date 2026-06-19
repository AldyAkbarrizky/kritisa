import Link from "next/link";
import { BrandIcon } from "@/components/brand-icon";
import { getCurrentUser } from "@/lib/auth";
import { ButtonLink } from "@/components/ui";
import { logoutAction } from "@/app/actions";

export async function StudentHeader() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-border bg-background/95">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="flex min-h-11 items-center gap-2 font-bold text-foreground"
        >
          <BrandIcon />
          <span className="font-serif text-xl tracking-normal">Kritisa</span>
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            href="/cerpen"
            className="rounded-lg px-3 py-2 text-sm font-semibold text-muted transition hover:bg-surface-muted hover:text-foreground"
          >
            Cerpen
          </Link>
          {user ? (
            <form action={logoutAction}>
              <button className="rounded-lg px-3 py-2 text-sm font-semibold text-muted transition hover:bg-surface-muted hover:text-foreground">
                {user.name.split(" ")[0]} · Keluar
              </button>
            </form>
          ) : (
            <ButtonLink href="/masuk" variant="secondary" className="px-3">
              Masuk
            </ButtonLink>
          )}
        </nav>
      </div>
    </header>
  );
}
