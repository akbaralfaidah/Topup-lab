"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { CheckCircle2, X } from "lucide-react";
import { IconButton } from "./actions";

const ToastContext = createContext<((message: string) => void) | null>(null);
export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("");
  return (
    <ToastContext.Provider value={setMessage}>
      {children}
      <div className="ui-toast-region" role="region" aria-label="Pemberitahuan">
        <div role="status" aria-live="polite" aria-atomic="true">
          {message && (
            <div className="ui-toast">
              <CheckCircle2 size={20} aria-hidden="true" />
              <p>{message}</p>
              <IconButton
                label="Tutup pemberitahuan"
                onClick={() => setMessage("")}
              >
                <X size={20} />
              </IconButton>
            </div>
          )}
        </div>
      </div>
    </ToastContext.Provider>
  );
}
export function useToast() {
  const toast = useContext(ToastContext);
  if (!toast) throw new Error("useToast requires ToastProvider");
  return toast;
}
