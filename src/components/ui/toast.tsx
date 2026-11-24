"use client";
import { createContext, useCallback, useContext, useState } from "react";
import { cn } from "@/lib/cn";

type Kind = "info" | "success" | "error";
interface Toast { id: number; kind: Kind; text: string }
const Ctx = createContext<(text: string, kind?: Kind) => void>(() => {});
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const push = useCallback((text: string, kind: Kind = "info") => {
    const id = Date.now() + Math.random();
    setItems((xs) => [...xs.slice(-2), { id, kind, text }]);
    setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 4000);
  }, []);
  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="no-print fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 items-center pointer-events-none">
        {items.map((t) => (
          <div key={t.id} role={t.kind === "error" ? "alert" : "status"}
            className={cn("animate-rise pointer-events-auto rounded-md px-4 py-2.5 text-sm shadow-pop",
              t.kind === "error" ? "bg-danger text-on-accent" : t.kind === "success" ? "bg-success text-on-accent" : "bg-text text-bg")}>
            {t.text}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
