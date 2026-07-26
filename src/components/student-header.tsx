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
          className="flex min-h-11 min-w-0 items-center gap-2 font-bold text-foreground"
        >
          <BrandIcon />
          <span className="truncate font-serif text-lg tracking-normal sm:text-xl">
            Kritisa
          </span>
        </Link>
        <nav className="flex shrink-0 items-center gap-1">
          <Link
            href="/cerpen"
            className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-muted transition hover:bg-surface-muted hover:text-foreground"
          >
            Cerpen
          </Link>
          {user ? (
            <>
              {user.role === "dosen" && (
                <ButtonLink
                  href="/dosen/dashboard"
                  variant="primary"
                  className="px-3"
                >
                  Dashboard
                </ButtonLink>
              )}
              <form action={logoutAction}>
                <button className="inline-flex min-h-11 items-center whitespace-nowrap rounded-lg px-3 text-sm font-semibold text-muted transition hover:bg-surface-muted hover:text-foreground">
                  {/* Nama disembunyikan di mobile: "Muhammad · Keluar" saja
                      sudah mendorong nav melewati lebar layar 360px. */}
                  <span className="hidden sm:inline">
                    {user.name.split(" ")[0]} ·{" "}
                  </span>
                  Keluar
                </button>
              </form>
            </>
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
