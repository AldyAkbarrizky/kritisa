"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Badge,
  Button,
  Card,
  ErrorBanner,
  textareaClassName,
} from "@/components/ui";

type ChatMessage = { role: "student" | "assistant"; content: string };

const starterPrompts = [
  "Apa makna kutipan ini?",
  "Bantu saya melihat unsur sastranya.",
  "Apa yang bisa saya kritisi dari kutipan ini?",
  "Apa makna sosial dari kutipan ini?",
  "Adakah perspektif lain yang bisa digunakan?",
  "Hubungkan kutipan ini dengan kehidupan nyata.",
  "Bimbing saya berpikir lebih kritis.",
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
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  async function sendMessage(message: string) {
    const trimmed = message.trim();
    if (!trimmed || isSending) return;
    setError("");
    setInput("");
    setIsSending(true);
    setMessages((c) => [...c, { role: "student", content: trimmed }]);
    try {
      const res = await fetch("/api/ai/chat", {
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
      const p = (await res.json()) as
        | { ok: true; data: { reply: string; conversationId: string } }
        | { ok: false; error: { message: string } };
      if (!p.ok) {
        setError(p.error.message);
        return;
      }
      setConversationId(p.data.conversationId);
      setMessages((c) => [...c, { role: "assistant", content: p.data.reply }]);
    } catch {
      setError(
        "AI sedang tidak tersedia. Anda tetap bisa melanjutkan anotasi dan refleksi secara manual.",
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {starterPrompts.map((p) => (
          <button
            key={p}
            type="button"
            className="cursor-pointer min-h-11 rounded-full border border-border bg-surface px-3 py-2 text-left text-sm font-semibold text-foreground transition hover:bg-surface-muted hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            onClick={() => setInput(p)}
          >
            {p}
          </button>
        ))}
      </div>
      <Card className="min-h-72 space-y-4 p-4">
        {messages.length === 0 ? (
          <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed border-border p-8 text-center text-sm leading-6 text-muted">
            Belum ada pesan. Pilih pertanyaan pemantik atau tulis pertanyaan
            Anda sendiri.
          </div>
        ) : (
          messages.map((m, i) => (
            <div
              key={`${m.role}-${i}`}
              className={`flex ${m.role === "student" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={
                  m.role === "student"
                    ? "max-w-[88%] rounded-2xl rounded-br-md bg-primary px-4 py-3 text-sm leading-6 text-primary-foreground"
                    : "max-w-[92%] rounded-2xl rounded-bl-md border border-border bg-surface px-4 py-3 text-sm leading-6 text-foreground"
                }
              >
                <div className="mb-1.5">
                  <Badge tone={m.role === "student" ? "primary" : "accent"}>
                    {m.role === "student" ? "Anda" : "Kritisa AI"}
                  </Badge>
                </div>
                {m.role === "assistant" ? (
                  <div className="kritisa-chat-markdown">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {m.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{m.content}</p>
                )}
              </div>
            </div>
          ))
        )}
        {isSending && (
          <div className="flex justify-start">
            <div className="max-w-[88%] rounded-2xl rounded-bl-md border border-border bg-surface px-4 py-3">
              <div className="mb-1.5">
                <Badge tone="accent">Kritisa AI</Badge>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted">
                <span className="inline-block size-2 animate-bounce rounded-full bg-accent [animation-delay:0ms]" />
                <span className="inline-block size-2 animate-bounce rounded-full bg-accent [animation-delay:150ms]" />
                <span className="inline-block size-2 animate-bounce rounded-full bg-accent [animation-delay:300ms]" />
                <span className="ml-1">AI sedang menulis...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </Card>
      <ErrorBanner message={error} />
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          void sendMessage(input);
        }}
      >
        <textarea
          className={textareaClassName}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tulis pertanyaan atau ide analisis Anda..."
          maxLength={1000}
          rows={3}
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
