"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button, ErrorBanner, chatInputClassName } from "@/components/ui";

type ChatMessage = {
  role: "student" | "assistant";
  content: string;
  /** Dicatat saat pesan dibuat. Tanpa ini setiap render menampilkan jam kini. */
  at: number;
};

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

function formatChatTime(at: number) {
  const d = new Date(at);
  return `${String(d.getHours()).padStart(2, "0")}.${String(d.getMinutes()).padStart(2, "0")}`;
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
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Composer mulai satu baris dan tumbuh sampai max-h-32 (128px), lalu
  // menyusut lagi setelah pesan terkirim atau saat chip pemantik dipilih.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [input]);

  useEffect(() => {
    // `block: "nearest"` menahan scroll di dalam kotak chat. Tanpa itu
    // seluruh halaman ikut melompat setiap kali ada pesan baru.
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
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
    setMessages((c) => [
      ...c,
      { role: "student", content: trimmed, at: Date.now() },
    ]);
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
      setMessages((c) => [
        ...c,
        { role: "assistant", content: p.data.reply, at: Date.now() },
      ]);
    } catch {
      setError(
        "AI sedang tidak tersedia. Anda tetap bisa melanjutkan anotasi dan refleksi secara manual.",
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Kuota — satu baris; detailnya baru muncul saat sisa menipis. */}
      <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5 shadow-sm">
        <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-muted">
          Kuota
        </span>
        <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-muted">
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
        <span className="shrink-0 text-xs font-bold tabular-nums text-foreground">
          {quotaUsed}/{quotaMax}
        </span>
      </div>
      {remaining <= 2 ? (
        <p className="text-xs text-muted">
          {remaining === 0
            ? "Kuota habis. Reset pukul 00:00."
            : `Sisa ${remaining} pesan lagi hari ini.`}
        </p>
      ) : null}

      {/* Pemantik — rail geser di mobile supaya tidak menumpuk 7 baris. */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden">
        {starterPrompts.map((p) => (
          <button
            key={p}
            type="button"
            className="min-h-9 shrink-0 cursor-pointer whitespace-nowrap rounded-full border border-border bg-surface px-3 text-xs font-semibold text-foreground transition hover:border-accent hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:min-h-11 sm:whitespace-normal sm:text-sm"
            onClick={() => setInput(p)}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Chat Area */}
      <div className="max-h-[60svh] min-h-[34svh] space-y-4 overflow-y-auto overscroll-contain rounded-2xl bg-surface-muted/60 p-3 sm:max-h-[480px] sm:min-h-[320px] sm:p-5">
        {messages.length === 0 ? (
          <div className="flex min-h-28 items-center justify-center px-4 text-center text-sm leading-6 text-muted sm:min-h-48">
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
                className={`mt-1 flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold sm:size-8 ${
                  m.role === "student"
                    ? "bg-primary text-primary-foreground"
                    : "bg-accent text-white"
                }`}
              >
                {m.role === "student" ? "A" : "K"}
              </div>

              {/* Bubble */}
              <div className="flex max-w-[85%] flex-col gap-0.5 sm:max-w-[80%]">
                <div
                  className={`rounded-2xl px-3.5 py-2.5 text-sm leading-6 sm:px-4 sm:py-3 ${
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
                  className={`text-[11px] text-muted ${
                    m.role === "student" ? "text-right" : "text-left"
                  }`}
                >
                  {m.role === "student" ? "Anda" : "Kritisa AI"} ·{" "}
                  {formatChatTime(m.at)}
                </span>
              </div>
            </div>
          ))
        )}

        {/* Typing indicator */}
        {isSending && (
          <div className="flex gap-2.5">
            <div className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-white sm:size-8">
              K
            </div>
            <div className="max-w-[85%] rounded-2xl rounded-tl-md border border-border bg-surface px-3.5 py-2.5 shadow-sm sm:max-w-[80%] sm:px-4 sm:py-3">
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
        className="flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void sendMessage(input);
        }}
      >
        <textarea
          ref={inputRef}
          className={chatInputClassName}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tulis pertanyaan Anda..."
          aria-label="Pertanyaan untuk Kritisa AI"
          maxLength={1000}
          rows={1}
        />
        <Button
          type="submit"
          className="shrink-0"
          disabled={isSending || input.trim().length < 2 || remaining <= 0}
        >
          {isSending ? "Mengirim..." : "Kirim"}
        </Button>
      </form>
    </div>
  );
}
