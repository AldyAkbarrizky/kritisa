import { hash, compare } from "bcryptjs";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import type { User } from "@/lib/types";

const SESSION_COOKIE = "kritisa_session";
const SALT_ROUNDS = 10;

// ── Password ──

export async function hashPassword(password: string) {
  return hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hashed: string) {
  return compare(password, hashed);
}

// ── Session ──

function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET?.trim() ?? "kritisa-default-secret-change-me";
}

function sign(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function encodeSigned(value: string, secret: string) {
  return `${Buffer.from(value).toString("base64url")}.${sign(value, secret)}`;
}

function decodeSigned(cookieValue: string | undefined, secret: string) {
  if (!cookieValue || !secret) return null;
  const [encoded, signature] = cookieValue.split(".");
  if (!encoded || !signature) return null;
  const value = Buffer.from(encoded, "base64url").toString("utf8");
  const expected = sign(value, secret);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) return null;
  return value;
}

export async function createSession(userId: string, role: string) {
  const secret = getSessionSecret();
  const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 7; // 7 days
  const cookieStore = await cookies();
  const value = `${userId}:${role}:${expiresAt}`;
  cookieStore.set(SESSION_COOKIE, encodeSigned(value, secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<{ userId: string; role: string } | null> {
  const secret = getSessionSecret();
  const value = decodeSigned((await cookies()).get(SESSION_COOKIE)?.value, secret);
  if (!value) return null;
  const [userId, role, expiresAt] = value.split(":");
  if (Number(expiresAt) < Date.now()) return null;
  return { userId, role };
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  if (!session) return null;
  const rows = await db.select().from(schema.users).where(eq(schema.users.id, session.userId));
  return (rows[0] ?? null) as User | null;
}

export async function requireAuth(role?: string) {
  const session = await getSession();
  if (!session) return null;
  if (role && session.role !== role) return null;
  const rows = await db.select().from(schema.users).where(eq(schema.users.id, session.userId));
  return (rows[0] ?? null) as User | null;
}

export async function requireDosen() {
  return requireAuth("dosen");
}

export async function requireMahasiswa() {
  return requireAuth("mahasiswa");
}

// ── Registration ──

export async function registerUser(input: {
  email: string;
  name: string;
  password: string;
  programStudy: string;
  university: string;
}) {
  const existing = await db.select().from(schema.users).where(eq(schema.users.email, input.email.toLowerCase().trim()));
  if (existing[0]) return { ok: false as const, message: "Email sudah terdaftar." };

  const passwordHash = await hashPassword(input.password);
  const id = `user_${crypto.randomUUID().replaceAll("-", "").slice(0, 16)}`;
  const now = new Date().toISOString();

  await db.insert(schema.users).values({
    id, email: input.email.toLowerCase().trim(), name: input.name.trim(),
    passwordHash, role: "mahasiswa", programStudy: input.programStudy.trim(),
    university: input.university.trim(), createdAt: now, updatedAt: now,
  });

  return { ok: true as const, userId: id };
}

// ── Login ──

export async function loginUser(email: string, password: string) {
  const rows = await db.select().from(schema.users).where(eq(schema.users.email, email.toLowerCase().trim()));
  const user = rows[0];
  if (!user) return { ok: false as const, message: "Email atau kata sandi tidak sesuai." };

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return { ok: false as const, message: "Email atau kata sandi tidak sesuai." };

  await createSession(user.id, user.role);
  return { ok: true as const, user: user as User };
}

export async function seedDefaultUsers() {
  const existing = await db.select().from(schema.users);
  if (existing.length > 0) return;

  const now = new Date().toISOString();
  const dosenHash = await hashPassword("kritisa123");
  const mhsHash = await hashPassword("kritisa123");

  await db.insert(schema.users).values([
    { id: "user_dosen_01", email: "dosen@kritisa.com", name: "Dosen Pengampu", passwordHash: dosenHash, role: "dosen", programStudy: "", university: "", createdAt: now, updatedAt: now },
    { id: "user_mhs_01", email: "mahasiswa@kritisa.com", name: "Mahasiswa Contoh", passwordHash: mhsHash, role: "mahasiswa", programStudy: "Sastra Indonesia", university: "Universitas Indonesia", createdAt: now, updatedAt: now },
  ]);
}
