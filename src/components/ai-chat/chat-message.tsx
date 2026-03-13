"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { X } from "lucide-react";

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
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const imageAttachments = attachments?.filter(
    (a) => a.contentType?.startsWith("image/") || a.url?.startsWith("data:image/")
  );

  return (
    <>
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
            <div className="mb-2 flex flex-wrap gap-2">
              {imageAttachments.map((img, i) => (
                <img
                  key={i}
                  src={img.url}
                  alt={img.name || "첨부 이미지"}
                  className="max-h-64 rounded-md object-contain cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setLightboxUrl(img.url)}
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

      {/* 이미지 라이트박스 */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
          >
            <X className="h-8 w-8" />
          </button>
          <img
            src={lightboxUrl}
            alt="원본 이미지"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
