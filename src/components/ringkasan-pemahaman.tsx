import ReactMarkdown from "react-markdown";
import { Card } from "@/components/ui";

export function RingkasanPemahaman({ content }: { content: string }) {
  return (
    <Card className="border-l-4 border-l-accent bg-accent-soft/50 space-y-3">
      <h2 className="text-lg font-bold text-foreground">Ringkasan Pemahaman</h2>
      <div className="kritisa-chat-markdown">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </Card>
  );
}
