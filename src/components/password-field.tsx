"use client";

import { useState } from "react";
import { inputClassName } from "@/components/ui";

export function PasswordField() {
  const [useDefault, setUseDefault] = useState(true);
  const [showPass, setShowPass] = useState(false);

  return (
    <div className="space-y-2">
      <label className="block">
        <span className="block text-sm font-semibold text-foreground">
          Kata Sandi
        </span>
        <span className="mt-2 block">
          <div className="relative">
            <input
              name="password"
              type={showPass ? "text" : "password"}
              className={inputClassName + " pr-12"}
              required
              minLength={6}
              value={useDefault ? "kritisa123" : undefined}
              onChange={useDefault ? undefined : (e) => {}}
              disabled={useDefault}
              placeholder={useDefault ? "" : "Masukkan kata sandi..."}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted transition hover:bg-surface-muted hover:text-foreground"
            >
              {showPass ? (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </span>
      </label>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={useDefault}
          onChange={(e) => setUseDefault(e.target.checked)}
          className="size-4 rounded border-border accent-primary"
        />
        <span className="text-sm text-muted">
          Gunakan password default (kritisa123)
        </span>
      </label>
    </div>
  );
}
