"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui";

interface ImageUploadProps {
  label?: string;
  onUploaded: (url: string) => void;
}

export function ImageUpload({
  label = "Unggah",
  onUploaded,
}: ImageUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      // 1. Get auth params from server
      const authRes = await fetch("/api/upload/auth");
      if (!authRes.ok) {
        const { error: msg } = await authRes.json().catch(() => ({}));
        throw new Error(msg || "Gagal mendapatkan izin unggah.");
      }
      const { publicKey, token, expire, signature } = await authRes.json();

      // 2. Upload to ImageKit
      const form = new FormData();
      form.append("file", file);
      form.append("publicKey", publicKey);
      form.append("token", token);
      form.append("expire", String(expire));
      form.append("signature", signature);
      form.append("fileName", file.name);
      form.append("folder", "/kritisa/covers");
      form.append("useUniqueFileName", "true");

      const uploadRes = await fetch(
        "https://upload.imagekit.io/api/v1/files/upload",
        { method: "POST", body: form },
      );

      if (!uploadRes.ok) {
        const body = await uploadRes.text();
        throw new Error(`Unggah gagal: ${uploadRes.status} ${body}`);
      }

      const data = await uploadRes.json();
      onUploaded(String(data.url ?? ""));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengunggah gambar.");
    } finally {
      setUploading(false);
      // Reset file input so the same file can be re-uploaded
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-1">
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/avif"
        onChange={handleFileChange}
        className="hidden"
      />
      <Button
        type="button"
        variant="secondary"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? "Mengunggah..." : label}
      </Button>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
