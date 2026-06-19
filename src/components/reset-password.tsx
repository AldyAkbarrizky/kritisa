"use client";

import { useState } from "react";
import { resetPasswordAction } from "@/app/actions";

export function ResetPasswordButton({ userId }: { userId: string }) {
  const [show, setShow] = useState(false);

  if (!show) {
    return (
      <button type="button" onClick={() => setShow(true)}
        className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-surface-muted">
        Reset Password
      </button>
    );
  }

  return (
    <form action={resetPasswordAction} className="flex items-center gap-2">
      <input type="hidden" name="id" value={userId} />
      <span className="text-sm text-muted">Reset ke kritisa123?</span>
      <button type="submit" className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg bg-danger px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-danger/90">
        Ya, Reset
      </button>
      <button type="button" onClick={() => setShow(false)}
        className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface px-3 py-2.5 text-sm font-semibold text-foreground transition hover:bg-surface-muted">
        Batal
      </button>
    </form>
  );
}
