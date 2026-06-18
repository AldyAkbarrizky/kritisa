"use client";

import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  ErrorBanner,
  textareaClassName,
} from "@/components/ui";

type ChatMessage = {
  role: "student" | "assistant";
  content: string;
};

const starterPrompts = [
  "Apa yang bisa saya kritik dari kutipan ini?",
  "Bantu saya melihat unsur strukturalnya.",
  "Apa kemungkinan makna sosial dari kutipan ini?",
  "Pertanyaan kritis apa yang bisa saya ajukan?",
];

export function ChatInterface({
  storySlug,
  quoteText,
  annotationId,
}: {
  storySlug: string;
  quoteText?: string;
  annotationId?: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);

  async function sendMessage(message: string) {
    const trimmed = message.trim();
    if (!trimmed || isSending) {
      return;
    }

    setError("");
    setInput("");
    setIsSending(true);
    setMessages((current) => [
      ...current,
      { role: "student", content: trimmed },
    ]);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storySlug,
          quoteText,
          annotationId,
          conversationId,
          message: trimmed,
        }),
      });
      const payload = (await response.json()) as
        | {
            ok: true;
            data: { reply: string; conversationId: string };
          }
        | { ok: false; error: { message: string } };

      if (!payload.ok) {
        setError(payload.error.message);
        return;
      }

      setConversationId(payload.data.conversationId);
      setMessages((current) => [
        ...current,
        { role: "assistant", content: payload.data.reply },
      ]);
    } catch {
      setError(
        "AI sedang tidak tersedia atau mencapai batas penggunaan. Kamu tetap bisa melanjutkan anotasi dan refleksi secara manual.",
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {starterPrompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            className="cursor-pointer min-h-11 rounded-full border border-border bg-surface px-3 py-2 text-left text-sm font-semibold text-foreground transition hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            onClick={() => setInput(prompt)}
          >
            {prompt}
          </button>
        ))}
      </div>

      <Card className="min-h-72 space-y-3">
        {messages.length === 0 ? (
          <div className="rounded-lg border border-border bg-surface-muted p-4 text-sm leading-6 text-muted">
            Belum ada pesan. Pilih pertanyaan pemantik atau tulis pertanyaanmu
            sendiri.
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={
                message.role === "student"
                  ? "ml-auto max-w-[92%] rounded-lg bg-primary px-4 py-3 text-sm leading-6 text-primary-foreground"
                  : "mr-auto max-w-[92%] rounded-lg border border-border bg-surface-muted px-4 py-3 text-sm leading-6 text-foreground"
              }
            >
              <div className="mb-1">
                <Badge tone={message.role === "student" ? "primary" : "accent"}>
                  {message.role === "student" ? "Kamu" : "Kritisa AI"}
                </Badge>
              </div>
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          ))
        )}
        {isSending ? (
          <div className="rounded-lg border border-border bg-surface-muted p-3 text-sm text-muted">
            AI sedang menyusun tanggapan...
          </div>
        ) : null}
      </Card>

      <ErrorBanner message={error} />

      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          void sendMessage(input);
        }}
      >
        <textarea
          className={textareaClassName}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Tulis pertanyaan atau ide analisismu..."
          maxLength={1000}
        />
        <Button
          type="submit"
          fullWidth
          disabled={isSending || input.trim().length < 2}
        >
          {isSending ? "Mengirim..." : "Kirim"}
        </Button>
      </form>
    </div>
  );
}
