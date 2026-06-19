"use client";

import ReactMarkdown from "react-markdown";

export function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="kritisa-chat-markdown text-base leading-7 text-foreground">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
