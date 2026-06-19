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
        | { ok: true; data: { reply: string; conversationId: string } }
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
      {/* Starter prompts */}
      <div className="flex flex-wrap gap-2">
        {starterPrompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            className="cursor-pointer min-h-11 rounded-full border border-border bg-surface px-3 py-2 text-left text-sm font-semibold text-foreground transition hover:bg-surface-muted hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            onClick={() => setInput(prompt)}
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat area */}
      <Card className="min-h-72 space-y-4 p-4">
        {messages.length === 0 ? (
          <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed border-border p-8 text-center text-sm leading-6 text-muted">
            Belum ada pesan. Pilih pertanyaan pemantik atau tulis pertanyaanmu
            sendiri.
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`flex ${message.role === "student" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={
                  message.role === "student"
                    ? "max-w-[88%] rounded-2xl rounded-br-md bg-primary px-4 py-3 text-sm leading-6 text-primary-foreground"
                    : "max-w-[92%] rounded-2xl rounded-bl-md border border-border bg-surface px-4 py-3 text-sm leading-6 text-foreground"
                }
              >
                <div className="mb-1.5">
                  <Badge
                    tone={message.role === "student" ? "primary" : "accent"}
                  >
                    {message.role === "student" ? "Kamu" : "Kritisa AI"}
                  </Badge>
                </div>
                {message.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none prose-headings:text-foreground prose-headings:font-bold prose-headings:mt-4 prose-headings:mb-2 prose-p:leading-6 prose-li:leading-6 prose-strong:text-foreground prose-code:text-accent-strong prose-code:bg-surface-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-surface-muted prose-pre:rounded-lg prose-blockquote:border-l-4 prose-blockquote:border-accent prose-blockquote:bg-accent-soft prose-blockquote:px-3 prose-blockquote:py-1 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-hr:border-border">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{message.content}</p>
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

      {/* Input area */}
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
