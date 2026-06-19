import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const buttonVariants: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground shadow-[0_2px_0_rgb(247_139_15_/_0.22)] hover:bg-accent-strong focus-visible:outline-primary",
  secondary:
    "border border-border bg-surface text-foreground hover:bg-accent-soft focus-visible:outline-primary",
  ghost: "text-foreground hover:bg-surface-muted focus-visible:outline-primary",
  danger:
    "bg-danger text-white shadow-sm hover:bg-danger/90 focus-visible:outline-danger",
};

export function Button({
  className,
  variant = "primary",
  fullWidth,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  fullWidth?: boolean;
}) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 max-w-full cursor-pointer items-center justify-center rounded-md px-4 py-2.5 text-center text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
        buttonVariants[variant],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    />
  );
}

export function ButtonLink({
  href,
  className,
  variant = "primary",
  fullWidth,
  children,
}: {
  href: string;
  className?: string;
  variant?: Variant;
  fullWidth?: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-11 max-w-full cursor-pointer items-center justify-center rounded-md px-4 py-2.5 text-center text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2",
        buttonVariants[variant],
        fullWidth && "w-full",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "max-w-full rounded-md border border-border bg-surface p-4 shadow-[0_1px_0_rgb(26_31_46_/_0.04)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "primary" | "accent" | "success" | "danger";
}) {
  const tones = {
    neutral: "border-border bg-surface-muted text-muted",
    primary: "border-primary/20 bg-primary/10 text-primary",
    accent: "border-accent/20 bg-accent-soft text-accent-strong",
    success: "border-success/20 bg-success/10 text-success",
    danger: "border-danger/20 bg-danger/10 text-danger",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function Field({
  label,
  labelSuffix,
  name,
  helper,
  error,
  children,
}: {
  label: string;
  labelSuffix?: string;
  name: string;
  helper?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block" htmlFor={name}>
      <span className="block text-sm font-semibold text-foreground">
        {label}
        {labelSuffix ? (
          <span className="ml-1 font-normal text-muted">{labelSuffix}</span>
        ) : null}
      </span>
      {helper ? (
        <span className="mt-1 block text-xs leading-5 text-muted">
          {helper}
        </span>
      ) : null}
      <span className="mt-2 block">{children}</span>
      {error ? (
        <span className="mt-1 block text-sm text-danger">{error}</span>
      ) : null}
    </label>
  );
}

export const inputClassName =
  "min-h-11 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-base text-foreground shadow-sm outline-none transition placeholder:text-muted/80 focus:border-primary focus:ring-4 focus:ring-primary/10";

export const selectClassName =
  "min-h-11 w-full rounded-lg border border-border bg-surface py-2.5 pl-3 pr-10 text-base text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10";

export const textareaClassName =
  "min-h-36 w-full rounded-lg border border-border bg-surface px-3 py-3 text-base leading-7 text-foreground shadow-sm outline-none transition placeholder:text-muted/80 focus:border-primary focus:ring-4 focus:ring-primary/10";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Card className="text-center">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {description ? (
        <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </Card>
  );
}

export function LoadingState({ label = "Memuat..." }: { label?: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4 text-sm text-muted">
      {label}
    </div>
  );
}

export function ErrorBanner({ message }: { message?: string | null }) {
  if (!message) {
    return null;
  }

  return (
    <div className="rounded-lg border border-danger/20 bg-danger/10 p-3 text-sm leading-6 text-danger">
      {message}
    </div>
  );
}

export function SuccessBanner({ message }: { message?: string | null }) {
  if (!message) {
    return null;
  }

  return (
    <div className="rounded-lg border border-success/20 bg-success/10 p-3 text-sm leading-6 text-success">
      {message}
    </div>
  );
}

export function PageIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="space-y-3">
      {eyebrow ? (
        <p className="text-xs font-bold uppercase tracking-wide text-accent-strong">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="break-words text-[2rem] font-bold leading-[1.04] text-foreground sm:text-5xl">
        {title}
      </h1>
      {description ? (
        <p className="text-base leading-7 text-muted">{description}</p>
      ) : null}
    </div>
  );
}
