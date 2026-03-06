"use client";

import { KeyboardEvent, useRef } from "react";
import { Send, ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  imagePreview?: string | null;
  onImageSelect?: (file: File) => void;
  onImageRemove?: () => void;
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  isLoading,
  imagePreview,
  onImageSelect,
  onImageRemove,
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if ((value.trim() || imagePreview) && !isLoading) onSubmit();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImageSelect) {
      if (!file.type.startsWith("image/")) {
        alert("이미지 파일만 첨부할 수 있습니다.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("이미지는 5MB 이하만 첨부할 수 있습니다.");
        return;
      }
      onImageSelect(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="border-t pt-4">
      {imagePreview && (
        <div className="mb-2 relative inline-block">
          <img
            src={imagePreview}
            alt="첨부 이미지"
            className="h-20 rounded-md border object-cover"
          />
          <button
            onClick={onImageRemove}
            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
      <div className="flex gap-2 items-end">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
        >
          <ImagePlus className="h-4 w-4" />
        </Button>
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="AI 코치에게 무엇이든 물어보세요..."
          rows={2}
          className="resize-none"
        />
        <Button
          onClick={onSubmit}
          disabled={(!value.trim() && !imagePreview) || isLoading}
          size="icon"
          className="shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
