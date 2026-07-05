"use client";

import { Button } from "@/components/ui";

export function ClearFormButton() {
  return (
    <Button
      type="button"
      variant="danger"
      onClick={() => {
        const form = document.querySelector<HTMLFormElement>("#story-form");
        form?.reset();
      }}
    >
      ✕ Kosongkan Semua
    </Button>
  );
}
