"use client";

import { useState } from "react";
import { resetPasswordAction } from "@/app/actions";

export function ResetPasswordButton({ userId }: { userId: string }) {
  const [show, setShow] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setShow(true)}
        className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg bg-danger px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-danger/90"
      >
        Reset Password
      </button>

      {show && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShow(false)}
        >
          <div
            className="mx-4 w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-foreground">
              Reset Password
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              Password mahasiswa akan direset ke{" "}
              <strong className="text-foreground">kritisa123</strong>.
              Lanjutkan?
            </p>
            <div className="mt-5 flex gap-3">
              <form action={resetPasswordAction}>
                <input type="hidden" name="id" value={userId} />
                <button
                  type="submit"
                  className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg bg-danger px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-danger/90"
                >
                  Ya, Reset
                </button>
              </form>
              <button
                type="button"
                onClick={() => setShow(false)}
                className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-surface-muted"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
