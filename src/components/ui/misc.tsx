import { Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";

export function EmptyState({ icon, title, body, action }: { icon: React.ReactNode; title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center gap-3 py-16 px-6 rounded-lg border border-dashed border-border">
      <div className="text-text-muted" aria-hidden="true">{icon}</div>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-sm text-text-muted max-w-sm">{body}</p>
      {action}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-md", className)} aria-hidden="true" />;
}

export function CreditsMeter({ credits }: { credits: number }) {
  const tone = credits === 0 ? "text-danger" : credits < 80 ? "text-warning" : "text-text-muted";
  return (
    <span className={cn("inline-flex items-center gap-1 text-sm font-medium", tone)} title="AI credits left">
      <Sparkles size={15} aria-hidden="true" />
      <span data-testid="credits">{credits}</span>
      <span className="sr-only">credits left</span>
    </span>
  );
}
