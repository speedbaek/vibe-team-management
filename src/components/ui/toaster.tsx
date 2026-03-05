"use client";

import { useToast } from "@/hooks/use-toast";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-lg border bg-background p-4 shadow-lg transition-all ${
            toast.variant === "destructive"
              ? "border-destructive text-destructive"
              : "border-border"
          }`}
        >
          {toast.title && <div className="font-semibold">{toast.title}</div>}
          {toast.description && (
            <div className="text-sm text-muted-foreground">{toast.description}</div>
          )}
          <button
            onClick={() => dismiss(toast.id)}
            className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
          >
            x
          </button>
        </div>
      ))}
    </div>
  );
}
