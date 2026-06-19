import Link from "next/link";
import type { ReactNode } from "react";
import { logoutAction } from "@/app/actions";
import { BrandIcon } from "@/components/brand-icon";
import { FormSubmit } from "@/components/form-submit";

const navItems = [
  { href: "/dosen/dashboard", label: "Ringkasan" },
  { href: "/dosen/cerpen", label: "Cerpen" },
  { href: "/dosen/media", label: "Media" },
  { href: "/dosen/mahasiswa", label: "Mahasiswa" },
  { href: "/dosen/jawaban", label: "Jawaban" },
];

export function DashboardShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between">
          <Link
            href="/dosen/dashboard"
            className="flex min-h-11 items-center gap-2 font-bold"
          >
            <BrandIcon />
            <span className="font-serif text-xl">Dashboard Dosen</span>
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-muted transition hover:bg-surface-muted hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
            <form action={logoutAction}>
              <FormSubmit
                variant="ghost"
                fullWidth={false}
                pendingLabel="Keluar..."
              >
                Keluar
              </FormSubmit>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="max-w-2xl text-sm leading-6 text-muted">
              {description}
            </p>
          ) : null}
        </div>
        {children}
      </main>
    </div>
  );
}
