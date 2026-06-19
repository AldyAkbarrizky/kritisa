"use client";

import { useState } from "react";
import { inputClassName } from "@/components/ui";

export function PasswordField() {
  const [useDefault, setUseDefault] = useState(true);

  return (
    <div className="space-y-2">
      <label className="block">
        <span className="block text-sm font-semibold text-foreground">Kata Sandi</span>
        {!useDefault ? (
          <span className="mt-2 block">
            <input name="password" type="password" className={inputClassName} required minLength={6} placeholder="Masukkan kata sandi..." />
          </span>
        ) : (
          <span className="mt-2 block">
            <input className={inputClassName} value="kritisa123" disabled />
            <input type="hidden" name="password" value="kritisa123" />
          </span>
        )}
      </label>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={useDefault} onChange={e => setUseDefault(e.target.checked)} className="size-4 rounded border-border accent-primary" />
        <span className="text-sm text-muted">Gunakan password default (kritisa123)</span>
      </label>
    </div>
  );
}
