"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScaledCard } from "@/components/deck/scaled-card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { TEMPLATES } from "@/lib/templates";
import { getTheme } from "@/lib/themes";
import { api } from "@/lib/api";

export function TemplateGrid() {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const previews = TEMPLATES.map((t) => ({ t, first: t.cards()[0], count: t.cards().length }));
  return (
    <div className="mx-auto max-w-[var(--layout-content-max)]">
      <h1 className="text-xl font-bold">Templates</h1>
      <p className="text-text-muted mt-1 mb-6">A ready-made structure to fill in.</p>
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {previews.map(({ t, first, count }) => (
          <li key={t.key} className="rounded-lg border border-border bg-bg overflow-hidden flex flex-col">
            <div className="aspect-[16/10] border-b border-border"><ScaledCard card={first} theme={getTheme(t.themeId)} className="h-full w-full" /></div>
            <div className="p-4 flex flex-col gap-2 flex-1">
              <h2 className="font-semibold">{t.name}</h2>
              <p className="text-sm text-text-muted flex-1">{t.blurb} <span className="whitespace-nowrap">{count} cards.</span></p>
              <Button variant="primary" size="sm" className="self-start" loading={busy === t.key} onClick={async () => {
                setBusy(t.key);
                try {
                  const r = await api<{ id: string }>("/api/decks", { json: { title: t.name, themeId: t.themeId, cards: t.cards() } });
                  router.push(`/decks/${r.id}`);
                } catch (e) { toast((e as Error).message, "error"); setBusy(null); }
              }}>Use template</Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
