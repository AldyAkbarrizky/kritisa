"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui";

export function FormSubmit({
  children,
  pendingLabel = "Menyimpan...",
  variant = "primary",
  fullWidth = true,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  fullWidth?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant={variant} fullWidth={fullWidth} disabled={pending}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
