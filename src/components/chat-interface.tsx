"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Button,
  Card,
  ErrorBanner,
  textareaClassName,
} from "@/components/ui";
import type { AiChatQuota } from "@/lib/ai/limits";

type ChatMessage = {
  role: "student" | "assistant";
  content: string;
};

const starterPrompts = [
  "Apa makna kutipan ini?",
  "Bantu saya melihat unsur sastranya.",
  "Apa yang bisa saya kritisi dari kutipan ini?",
  "Apa makna sosial dari kutipan ini?",
  "Adakah perspektif lain yang bisa digunakan?",
  "Hubungkan kutipan ini dengan kehidupan nyata.",
  "Bimbing saya berpikir lebih kritis.",
];

const markdownComponents: Components = {
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="min-w-[34rem] border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-surface-muted text-left text-foreground">
      {children}
    </thead>
  ),
  th: ({ children }) => (
    <th className="border-b border-border px-3 py-2 align-top font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-border px-3 py-2 align-top leading-7">
      {children}
    </td>
  ),
  p: ({ children }) => <p>{children}</p>,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  ),
};

function normalizeAssistantContent(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p>/gi, "\n\n")
    .replace(/<\/?p>/gi, "")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

export function ChatInterface({
  storySlug,
  quoteText,
  annotationId,
  studentName,
  initialQuota,
}: {
  storySlug: string;
  quoteText?: string;
  annotationId?: string;
  studentName: string;
  initialQuota: AiChatQuota;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [quota, setQuota] = useState(initialQuota);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  async function sendMessage(message: string) {
    const trimmed = message.trim();
    if (!trimmed || isSending) return;
    if (quota.remaining <= 0) {
      setError(
        `Kuota diskusi AI untuk cerpen ini sudah habis (${quota.used}/${quota.limit} pesan). Anda bisa lanjut ke refleksi dengan hasil diskusi yang sudah ada.`,
      );
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
            data: {
              reply: string;
              conversationId: string;
              quota?: AiChatQuota;
            };
          }
        | { ok: false; error: { message: string } };

      if (!payload.ok) {
        setMessages((current) => current.slice(0, -1));
        setError(payload.error.message);
        return;
      }

      setConversationId(payload.data.conversationId);
      setQuota(
        payload.data.quota ?? {
          ...quota,
          used: Math.min(quota.used + 1, quota.limit),
          remaining: Math.max(quota.remaining - 1, 0),
        },
      );
      setMessages((current) => [
        ...current,
        { role: "assistant", content: payload.data.reply },
      ]);
    } catch {
      setError(
        "AI sedang tidak tersedia atau mencapai batas penggunaan. Anda tetap bisa melanjutkan anotasi dan refleksi secara manual.",
      );
    } finally {
      setIsSending(false);
    }
  }

  const senderName = studentName.trim() || "Anda";
  const quotaPercent =
    quota.limit > 0 ? Math.min((quota.used / quota.limit) * 100, 100) : 100;
  const isQuotaExhausted = quota.remaining <= 0;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-surface p-3 shadow-[0_1px_0_rgb(26_31_46_/_0.04)]">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-bold text-foreground">
            Kuota Diskusi AI
          </p>
          <p className="shrink-0 text-sm font-semibold text-muted">
            {quota.used}/{quota.limit} pesan
          </p>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{ width: `${quotaPercent}%` }}
          />
        </div>
        <p className="mt-2 text-xs leading-5 text-muted">
          {isQuotaExhausted
            ? "Kuota habis. Lanjutkan ke refleksi dan gunakan rangkuman diskusi yang sudah ada."
            : `Sisa ${quota.remaining} pesan untuk diskusi AI pada cerpen ini.`}
        </p>
      </div>

      {/* Starter prompts */}
      <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
        {starterPrompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            className="min-h-11 shrink-0 cursor-pointer rounded-full border border-border bg-surface px-3 py-2 text-left text-sm font-semibold leading-5 text-foreground transition hover:border-accent hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-55"
            onClick={() => setInput(prompt)}
            disabled={isQuotaExhausted || isSending}
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat area */}
      <Card className="min-h-[26rem] space-y-5 overflow-hidden !rounded-2xl !p-3 sm:!p-4">
        {messages.length === 0 ? (
          <div className="flex min-h-80 items-center justify-center rounded-2xl border border-dashed border-border bg-surface-muted/55 p-6 text-center text-sm leading-7 text-muted">
            Belum ada pesan. Pilih pertanyaan pemantik atau tulis pertanyaan Anda
            sendiri.
          </div>
        ) : (
          messages.map((message, index) => {
            const isStudent = message.role === "student";

            return (
              <div
                key={`${message.role}-${index}`}
                className={`flex items-end gap-2.5 ${isStudent ? "justify-end" : "justify-start"}`}
              >
                {!isStudent ? (
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-accent-strong">
                    AI
                  </div>
                ) : null}
                <div
                  className={`flex max-w-[82%] flex-col gap-1.5 sm:max-w-[76%] ${isStudent ? "items-end" : "items-start"}`}
                >
                  <span className="px-1 text-xs font-semibold leading-none text-muted">
                    {isStudent ? senderName : "Kritisa AI"}
                  </span>
                  <div
                    className={
                      isStudent
                        ? "rounded-2xl rounded-br-sm bg-primary px-4 py-3 text-sm leading-7 text-primary-foreground shadow-[0_10px_24px_rgb(1_64_145_/_0.12)]"
                        : "rounded-2xl rounded-bl-sm border border-border bg-surface px-4 py-3 text-sm leading-7 text-foreground shadow-[0_10px_24px_rgb(26_31_46_/_0.06)]"
                    }
                  >
                    {isStudent ? (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    ) : (
                      <div className="kritisa-chat-markdown">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={markdownComponents}
                        >
                          {normalizeAssistantContent(message.content)}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
                {isStudent ? (
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {senderName.slice(0, 1).toUpperCase()}
                  </div>
                ) : null}
              </div>
            );
          })
        )}
        {isSending && (
          <div className="flex items-end gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-accent-strong">
              AI
            </div>
            <div className="flex max-w-[82%] flex-col gap-1.5 sm:max-w-[76%]">
              <span className="px-1 text-xs font-semibold leading-none text-muted">
                Kritisa AI
              </span>
              <div className="rounded-2xl rounded-bl-sm border border-border bg-surface px-4 py-3 shadow-[0_10px_24px_rgb(26_31_46_/_0.06)]">
                <div className="flex min-h-7 items-center gap-1.5 text-sm leading-7 text-muted">
                  <span className="inline-block size-2 animate-bounce rounded-full bg-accent [animation-delay:0ms]" />
                  <span className="inline-block size-2 animate-bounce rounded-full bg-accent [animation-delay:150ms]" />
                  <span className="inline-block size-2 animate-bounce rounded-full bg-accent [animation-delay:300ms]" />
                  <span className="ml-1">AI sedang menulis...</span>
                </div>
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
          placeholder={
            isQuotaExhausted
              ? "Kuota diskusi AI sudah habis."
              : "Tulis pertanyaan atau ide analisis Anda..."
          }
          maxLength={1000}
          rows={3}
          disabled={isQuotaExhausted}
        />
        <Button
          type="submit"
          fullWidth
          disabled={isSending || input.trim().length < 2 || isQuotaExhausted}
        >
          {isSending ? "Mengirim..." : isQuotaExhausted ? "Kuota Habis" : "Kirim"}
        </Button>
      </form>
    </div>
  );
}
