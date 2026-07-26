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
      {/* Latar putih polos: teks AI kini tanpa bubble, jadi ia butuh permukaan
          baca yang tenang — bukan tint abu di balik teks lebar penuh. */}
      <div className="max-h-[60svh] min-h-[34svh] space-y-5 overflow-y-auto overscroll-contain rounded-2xl border border-border bg-surface p-4 sm:max-h-[480px] sm:min-h-[320px] sm:p-5">
        {messages.length === 0 ? (
          <div className="flex min-h-28 items-center justify-center px-4 text-center text-sm leading-6 text-muted sm:min-h-48">
            Belum ada pesan. Pilih pertanyaan pemantik atau tulis pertanyaan
            Anda sendiri.
          </div>
        ) : (
          messages.map((m, i) =>
            m.role === "student" ? (
              // Pesan mahasiswa: pil rata kanan. Pendek, jadi tak apa dibatasi.
              <div key={`${m.role}-${i}`} className="flex justify-end">
                <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-primary px-3.5 py-2.5 text-sm leading-6 text-primary-foreground">
                  {m.content}
                </p>
              </div>
            ) : (
              // Jawaban AI: lebar penuh, tanpa bubble & avatar. Avatar + gap +
              // max-w-[85%] + padding bubble menyisakan hanya ~203px untuk teks
              // di layar 360px, sehingga daftar berpoin patah tiap 3-4 kata.
              <div key={`${m.role}-${i}`} className="space-y-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-accent-strong">
                  Kritisa AI · {formatChatTime(m.at)}
                </p>
                <div className="kritisa-chat-markdown text-foreground">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {m.content}
                  </ReactMarkdown>
                </div>
              </div>
            ),
          )
        )}

        {/* Typing indicator */}
        {isSending && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-accent-strong">
              Kritisa AI
            </p>
            <div>
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
