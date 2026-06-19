import type { Perspective } from "@/lib/types";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function nowIso() {
  return new Date().toISOString();
}

export function makeId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replaceAll("-", "").slice(0, 18)}`;
}

export function sanitizeText(
  value: FormDataEntryValue | string | null | undefined,
) {
  return String(value ?? "")
    .replace(/\u0000/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizeLongText(
  value: FormDataEntryValue | string | null | undefined,
) {
  return String(value ?? "")
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

const TZ = "Asia/Jakarta";

export function formatMonth(value: string) {
  if (!/^\d{4}-\d{2}$/.test(value)) {
    return value || "-";
  }

  const [year, month] = value.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: TZ,
  }).format(date);
}

export function formatDate(value: string) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TZ,
  }).format(new Date(value));
}

export function formatDateTime(value: string) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  }).format(new Date(value));
}

export function truncate(value: string, length = 140) {
  if (value.length <= length) {
    return value;
  }

  return `${value.slice(0, length).trim()}...`;
}

export function normalizePerspective(value: string): Perspective {
  if (value === "structural" || value === "non_structural") {
    return value;
  }

  return "general";
}

export function perspectiveLabel(value: string) {
  const labels: Record<string, string> = {
    structural: "Struktural",
    non_structural: "Non-struktural",
    general: "Umum",
  };

  return labels[value];
}

export function safeInternalPath(
  value: string | null | undefined,
  fallback = "/cerpen",
) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}

export function firstSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function csvEscape(value: string | number | undefined | null) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}

export function csvLine(values: Array<string | number | undefined | null>) {
  return values.map(csvEscape).join(",");
}

export function todayStamp() {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: TZ });
  return fmt.format(now).replace(/-/g, "");
}
