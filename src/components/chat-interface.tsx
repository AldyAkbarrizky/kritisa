"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button, ErrorBanner, textareaClassName } from "@/components/ui";

type ChatMessage = { role: "student" | "assistant"; content: string };

const QUOTA_MAX = 8;

const starterPrompts = [
  "Apa makna kutipan ini?",
  "Bantu saya melihat unsur sastranya.",
  "Apa yang bisa saya kritisi dari kutipan ini?",
  "Apa makna sosial dari kutipan ini?",
  "Adakah perspektif lain yang bisa digunakan?",
  "Hubungkan kutipan ini dengan kehidupan nyata.",
  "Bimbing saya berpikir lebih kritis.",
];

function formatChatTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}.${String(now.getMinutes()).padStart(2, "0")}`;
}

export function ChatInterface({
  storySlug,
  quoteText,
  annotationId,
  quotaUsed: initialQuotaUsed,
  quotaMax = QUOTA_MAX,
}: {
  storySlug: string;
  quoteText?: string;
  annotationId?: string;
  quotaUsed?: number;
  quotaMax?: number;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [quotaUsed, setQuotaUsed] = useState(initialQuotaUsed ?? 0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const remaining = Math.max(0, quotaMax - quotaUsed);

  async function sendMessage(message: string) {
    const trimmed = message.trim();
    if (!trimmed || isSending) return;
    if (remaining <= 0) {
      setError(
        `Kuota diskusi hari ini sudah habis (${quotaMax}/${quotaMax}). Kuota direset pukul 00:00.`,
      );
      return;
    }
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
        | {
            ok: true;
            data: { reply: string; conversationId: string; quotaUsed: number };
          }
        | { ok: false; error: { message: string } };
      if (!p.ok) {
        setError(p.error.message);
        return;
      }
      setConversationId(p.data.conversationId);
      setQuotaUsed(p.data.quotaUsed);
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
      {/* Quota Progress Bar */}
      <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-muted uppercase tracking-wide">
            Kuota Diskusi Hari Ini
          </span>
          <span className="text-xs font-bold text-foreground">
            {quotaUsed}/{quotaMax}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              remaining === 0
                ? "bg-danger"
                : remaining <= 2
                  ? "bg-accent"
                  : "bg-primary"
            }`}
            style={{ width: `${Math.min(100, (quotaUsed / quotaMax) * 100)}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted">
          {remaining === 0
            ? "Kuota habis. Reset pukul 00:00."
            : `Sisa ${remaining} pesan lagi hari ini.`}
        </p>
      </div>

      {/* Quick Prompts */}
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

      {/* Chat Area */}
      <div className="min-h-[320px] max-h-[480px] overflow-y-auto space-y-4 rounded-2xl bg-surface-muted/60 p-4 sm:p-5">
        {messages.length === 0 ? (
          <div className="flex min-h-48 items-center justify-center text-center text-sm leading-6 text-muted">
            Belum ada pesan. Pilih pertanyaan pemantik atau tulis pertanyaan
            Anda sendiri.
          </div>
        ) : (
          messages.map((m, i) => (
            <div
              key={`${m.role}-${i}`}
              className={`flex gap-2.5 ${m.role === "student" ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Avatar */}
              <div
                className={`mt-1 flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  m.role === "student"
                    ? "bg-primary text-primary-foreground"
                    : "bg-accent text-white"
                }`}
              >
                {m.role === "student" ? "A" : "K"}
              </div>

              {/* Bubble */}
              <div className="flex flex-col gap-0.5 max-w-[80%]">
                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
                    m.role === "student"
                      ? "rounded-tr-md bg-primary text-primary-foreground"
                      : "rounded-tl-md bg-surface border border-border text-foreground shadow-sm"
                  }`}
                >
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
                <span
                  className={`text-[10px] text-muted ${
                    m.role === "student" ? "text-right" : "text-left"
                  }`}
                >
                  {m.role === "student" ? "Anda" : "Kritisa AI"} ·{" "}
                  {formatChatTime()}
                </span>
              </div>
            </div>
          ))
        )}

        {/* Typing indicator */}
        {isSending && (
          <div className="flex gap-2.5">
            <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
              K
            </div>
            <div className="max-w-[80%] rounded-2xl rounded-tl-md border border-border bg-surface px-4 py-3 shadow-sm">
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
      </div>

      <ErrorBanner message={error} />

      {/* Input */}
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
          disabled={isSending || input.trim().length < 2 || remaining <= 0}
        >
          {isSending ? "Mengirim..." : "Kirim"}
        </Button>
      </form>
    </div>
  );
}
