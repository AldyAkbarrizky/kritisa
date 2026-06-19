"use client";

import { useState } from "react";
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
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="flex min-h-11 items-center gap-2 font-bold text-foreground"
            title="Kembali ke Kritisa"
          >
            <BrandIcon />
            <span className="hidden font-serif text-lg sm:inline">
              Dashboard Dosen
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-muted transition hover:bg-surface-muted hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/"
              className="mr-1 rounded-lg px-3 py-2 text-sm font-semibold text-accent-strong transition hover:bg-accent-soft"
            >
              ← Kritisa
            </Link>
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

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="inline-flex min-h-11 items-center justify-center rounded-lg px-3 text-sm font-semibold text-muted transition hover:bg-surface-muted md:hidden"
          >
            {menuOpen ? "✕ Tutup" : "☰ Menu"}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="border-t border-border bg-surface px-4 py-3 md:hidden">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-semibold text-muted transition hover:bg-surface-muted hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
              <hr className="my-1 border-border" />
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-semibold text-accent-strong transition hover:bg-accent-soft"
              >
                ← Kembali ke Kritisa
              </Link>
              <form action={logoutAction}>
                <FormSubmit
                  variant="ghost"
                  fullWidth={true}
                  pendingLabel="Keluar..."
                >
                  Keluar
                </FormSubmit>
              </form>
            </nav>
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted">
          <Link
            href="/dosen/dashboard"
            className="font-semibold text-foreground transition hover:text-primary"
          >
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-foreground">{title}</span>
        </nav>

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
