"use client";

import { KeyboardEvent, useRef, useState, DragEvent } from "react";
import { Send, ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

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
  const [isDragging, setIsDragging] = useState(false);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if ((value.trim() || imagePreview) && !isLoading) onSubmit();
    }
  };

  const validateAndSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 첨부할 수 있습니다.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("이미지는 5MB 이하만 첨부할 수 있습니다.");
      return;
    }
    onImageSelect?.(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSelect(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSelect(file);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) validateAndSelect(file);
        return;
      }
    }
  };

  return (
    <div
      className={cn(
        "border-t pt-4 transition-colors",
        isDragging && "bg-primary/5 border-t-primary"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="mb-2 text-center text-sm text-primary font-medium py-2 border-2 border-dashed border-primary/40 rounded-md">
          이미지를 여기에 놓으세요
        </div>
      )}
      {imagePreview && !isDragging && (
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
          onPaste={handlePaste}
          placeholder="AI 코치에게 무엇이든 물어보세요... (이미지 붙여넣기/드래그 가능)"
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
