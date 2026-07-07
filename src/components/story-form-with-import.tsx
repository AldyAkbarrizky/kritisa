"use client";

import { useState } from "react";
import type { MediaSource, StoryWithMedia } from "@/lib/types";
import { StoryForm } from "@/components/story-form";
import { Button } from "@/components/ui";
import { ImportCerpenModal, type ImportPrefill } from "@/components/import-cerpen-modal";

export function StoryFormWithImport({
  mediaSources,
  story,
  error,
  saved,
}: {
  mediaSources: MediaSource[];
  story?: StoryWithMedia;
  error?: string | null;
  saved?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [prefill, setPrefill] = useState<ImportPrefill | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">
          Mulai dari kosong atau impor otomatis dari file .docx.
        </p>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setOpen(true)}
        >
          Import dari .docx
        </Button>
      </div>

      <StoryForm
        mediaSources={mediaSources}
        story={story}
        error={error}
        saved={saved}
        prefill={prefill}
      />

      <ImportCerpenModal
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={(data) => {
          setPrefill(data);
          setOpen(false);
        }}
      />
    </div>
  );
}
