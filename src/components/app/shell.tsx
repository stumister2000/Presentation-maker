"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Home, Star, LayoutTemplate, Trash2, Plus, Menu as MenuIcon, X } from "lucide-react";
import { Logo } from "./logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";


const NAV = [
  { href: "/home", label: "All decks", icon: Home, match: (p: string, v: string | null) => p === "/home" && !v },
  { href: "/home?view=favorites", label: "Favourites", icon: Star, match: (p: string, v: string | null) => p === "/home" && v === "favorites" },
  { href: "/templates", label: "Templates", icon: LayoutTemplate, match: (p: string) => p === "/templates" },
  { href: "/home?view=trash", label: "Trash", icon: Trash2, match: (p: string, v: string | null) => p === "/home" && v === "trash" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const view = useSearchParams().get("view");
  const [open, setOpen] = useState(false);


  const nav = (
    <nav aria-label="Main" className="flex flex-col gap-1">
      {NAV.map((n) => {
        const active = n.match(path, view);
        return (
          <Link key={n.href} href={n.href} onClick={() => setOpen(false)} aria-current={active ? "page" : undefined}
            className={cn("flex items-center gap-2.5 rounded-md px-3 h-9 text-sm font-medium", active ? "bg-surface-2 text-text" : "text-text-muted hover:bg-surface hover:text-text")}>
            <n.icon size={17} aria-hidden="true" />{n.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[var(--layout-sidebar)_1fr]">
      <aside className={cn("bg-surface border-r border-border px-3 py-4 flex-col gap-5",
        "fixed inset-y-0 left-0 z-40 w-[var(--layout-sidebar)] lg:static lg:flex", open ? "flex" : "hidden")}>
        <div className="flex items-center justify-between px-2"><Logo href="/home" />
          <button className="lg:hidden p-1.5 rounded-md hover:bg-surface-2" aria-label="Close menu" onClick={() => setOpen(false)}><X size={18} /></button>
        </div>
        <Link href="/create" onClick={() => setOpen(false)} className="inline-flex items-center justify-center gap-2 h-10 rounded-md bg-accent text-on-accent font-semibold text-sm hover:bg-accent-hover">
          <Plus size={17} aria-hidden="true" />Create new
        </Link>
        {nav}
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setOpen(false)} aria-hidden="true" />}
      <div className="min-w-0 flex flex-col">
        <header className="h-[var(--layout-header)] flex items-center gap-3 px-4 sm:px-6 border-b border-border bg-bg sticky top-0 z-20">
          <Button icon variant="ghost" className="lg:hidden" aria-label="Open menu" onClick={() => setOpen(true)}><MenuIcon size={20} /></Button>
          <div className="lg:hidden"><Logo href="/home" /></div>
        </header>
        <main className="flex-1 px-4 sm:px-8 py-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
