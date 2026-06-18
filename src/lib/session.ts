import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getStudentById } from "@/lib/storage";
import type { Student } from "@/lib/types";

const studentCookie = "kritisa_student_id";
const adminCookie = "kritisa_admin_session";

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

function getAdminSecret() {
  return process.env.ADMIN_SESSION_SECRET?.trim() ?? "";
}

function sign(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function encodeSigned(value: string, secret: string) {
  return `${Buffer.from(value).toString("base64url")}.${sign(value, secret)}`;
}

function decodeSigned(cookieValue: string | undefined, secret: string) {
  if (!cookieValue || !secret) {
    return null;
  }

  const [encoded, signature] = cookieValue.split(".");
  if (!encoded || !signature) {
    return null;
  }

  const value = Buffer.from(encoded, "base64url").toString("utf8");
  const expected = sign(value, secret);

  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return null;
  }

  return value;
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

export function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

export async function setStudentSession(studentId: string) {
  const cookieStore = await cookies();
  cookieStore.set(studentCookie, studentId, cookieOptions(60 * 60 * 24 * 14));
}

export async function getCurrentStudentId() {
  return (await cookies()).get(studentCookie)?.value ?? null;
}

export async function getCurrentStudent(): Promise<Student | null> {
  return getStudentById(await getCurrentStudentId());
}

export async function createAdminSession() {
  const secret = getAdminSecret();
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET belum dikonfigurasi.");
  }

  const expiresAt = Date.now() + 1000 * 60 * 60 * 8;
  const cookieStore = await cookies();
  cookieStore.set(adminCookie, encodeSigned(`admin:${expiresAt}`, secret), cookieOptions(60 * 60 * 8));
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(adminCookie);
}

export async function isAdminAuthenticated() {
  const secret = getAdminSecret();
  const value = decodeSigned((await cookies()).get(adminCookie)?.value, secret);

  if (!value) {
    return false;
  }

  const [role, expiresAt] = value.split(":");
  return role === "admin" && Number(expiresAt) > Date.now();
}

export async function requireAdminSession() {
  if (!(await isAdminAuthenticated())) {
    redirect("/dosen/login");
  }
}

export function verifyAdminCredentials(username: string, password: string) {
  const configuredUsername = process.env.ADMIN_USERNAME?.trim();
  const configuredHash = process.env.ADMIN_PASSWORD_HASH?.trim().toLowerCase();

  if (!configuredUsername || !configuredHash) {
    return {
      ok: false,
      message: "Kredensial dosen belum dikonfigurasi di environment.",
    };
  }

  if (username !== configuredUsername) {
    return { ok: false, message: "Nama pengguna atau kata sandi tidak sesuai." };
  }

  const incomingHash = hashPassword(password);
  if (!safeEqual(incomingHash, configuredHash)) {
    return { ok: false, message: "Nama pengguna atau kata sandi tidak sesuai." };
  }

  return { ok: true, message: "OK" };
}
