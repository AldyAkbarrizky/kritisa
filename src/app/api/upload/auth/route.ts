import { NextResponse } from "next/server";
import { createHmac, randomUUID } from "node:crypto";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireAuth("dosen");
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    return NextResponse.json(
      { error: "ImageKit configuration missing" },
      { status: 500 },
    );
  }

  // ImageKit token-based signed upload:
  // signature = HMAC-SHA1(privateKey, token + expire)
  const token = randomUUID();
  const expire = String(Math.floor(Date.now() / 1000) + 60 * 30);
  const signature = createHmac("sha1", privateKey)
    .update(token + expire)
    .digest("hex");

  return NextResponse.json({
    publicKey,
    token,
    expire,
    signature,
  });
}
