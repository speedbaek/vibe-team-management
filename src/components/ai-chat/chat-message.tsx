"use client";

import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface Attachment {
  name?: string;
  contentType?: string;
  url: string;
}

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  attachments?: Attachment[];
}

export function ChatMessage({ role, content, attachments }: ChatMessageProps) {
  const imageAttachments = attachments?.filter(
    (a) => a.contentType?.startsWith("image/") || a.url?.startsWith("data:image/")
  );

  return (
    <div
      className={cn(
        "flex gap-3 mb-4",
        role === "user" ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-4 py-3 text-sm",
          role === "user"
            ? "bg-primary text-primary-foreground"
            : "bg-muted"
        )}
      >
        {imageAttachments && imageAttachments.length > 0 && (
          <div className="mb-2">
            {imageAttachments.map((img, i) => (
              <img
                key={i}
                src={img.url}
                alt={img.name || "첨부 이미지"}
                className="max-h-48 rounded-md object-cover"
              />
            ))}
          </div>
        )}
        {role === "assistant" ? (
          <div className="prose prose-sm max-w-none dark:prose-invert [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:mb-2 [&>ol]:mb-2">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        ) : (
          content && <div className="whitespace-pre-wrap">{content}</div>
        )}
      </div>
    </div>
  );
}
