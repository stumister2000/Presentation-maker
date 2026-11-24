"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Palette, Sparkles, Share2, Play, MoreHorizontal, Plus, Copy, Trash2, ArrowUp, ArrowDown, LayoutPanelLeft, Image as ImageIcon,
  StickyNote, FileDown, BarChart3, Undo2, Redo2, Check, CloudOff, Loader2, PanelLeftClose, PanelLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Menu } from "@/components/ui/menu";
import { CreditsMeter } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { ScaledCard } from "@/components/deck/scaled-card";
import { Presenter } from "@/components/present/presenter";
import { EditableCard } from "./editable-card";
import { InsertMenu } from "./insert-menu";
import { ThemeDrawer, AiDrawer, ShareModal, ExportModal, AnalyticsDrawer, ImageModal } from "./panels";
import { useDeckCards } from "./use-deck";
import { api } from "@/lib/api";
import { blankCard, cardTitle, type Card, type Layout } from "@/lib/blocks";
import { getTheme, themeStyle } from "@/lib/themes";
import { exportPptx } from "@/lib/export-pptx";
import type { Deck } from "@/server/queries";
import { cn } from "@/lib/cn";

const LAYOUT_LABEL: Record<Layout, string> = {
  none: "Text only", accent_left: "Image left", accent_right: "Image right", accent_top: "Image on top", background: "Image behind",
};

type Panel = null | "theme" | "ai" | "share" | "export" | "analytics";

export function Editor({ deck, credits: initialCredits }: { deck: Deck; credits: number }) {
  const router = useRouter();
  const toast = useToast();
  const d = useDeckCards(deck.id, deck.cards);
  const [title, setTitle] = useState(deck.title);
  const [themeId, setThemeId] = useState(deck.themeId);
  const [access, setAccess] = useState(deck.linkAccess);
  const [credits, setCredits] = useState(initialCredits);
  const [panel, setPanel] = useState<Panel>(null);
  const [aiCard, setAiCard] = useState<string | null>(null);
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const [insert, setInsert] = useState<null | { cardId: string; after: string | null; anchor: HTMLElement }>(null);
  const [image, setImage] = useState<null | { cardId: string; blockId?: string }>(null);
  const [presenting, setPresenting] = useState<number | null>(null);
  const [notesOpen, setNotesOpen] = useState<Record<string, boolean>>({});
  const [active, setActive] = useState(0);
  const [rail, setRail] = useState(true);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const cardEls = useRef<Record<string, HTMLElement | null>>({});
  const theme = getTheme(themeId);

  const patch = useCallback(async (body: object) => {
    try { await api(`/api/decks/${deck.id}`, { method: "PATCH", json: body }); }
    catch (e) { toast((e as Error).message, "error"); }
  }, [deck.id, toast]);

  // keyboard: undo / redo when not typing; P to present
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest?.("[contenteditable], input, textarea, select");
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "z" && !typing) { e.preventDefault(); (e.shiftKey ? d.redo() : d.undo()) || toast("Nothing to " + (e.shiftKey ? "redo" : "undo")); }
      if (mod && e.key.toLowerCase() === "y" && !typing) { e.preventDefault(); d.redo(); }
      if (mod && e.key === "Enter" && !typing) { e.preventDefault(); setPresenting(active); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [d, toast, active]);

  // track which card is in view for the rail
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) if (en.isIntersecting) { const i = Number((en.target as HTMLElement).dataset.index); if (!Number.isNaN(i)) setActive(i); }
    }, { rootMargin: "-45% 0px -45% 0px" });
    Object.values(cardEls.current).forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [d.cards.length]);

  const scrollTo = (id: string) => cardEls.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });

  function addCard(afterIndex: number) {
    const c = blankCard("");
    d.insertCard(afterIndex, c);
    setFocusKey(`${c.content[0].id}:`);
    setTimeout(() => scrollTo(c.id), 50);
  }

  const saveLabel = { saved: "Saved", saving: "Saving…", unsaved: "Editing…", error: "Offline. Retrying…", signedOut: "Signed out. Changes not saved" }[d.save];
  const SaveIcon = { saved: Check, saving: Loader2, unsaved: Loader2, error: CloudOff, signedOut: CloudOff }[d.save];

  return (
    <div className="min-h-dvh flex flex-col bg-surface">
      {/* top bar */}
      <header className="no-print sticky top-0 z-30 h-[var(--layout-header)] flex items-center gap-2 px-2 sm:px-4 border-b border-border bg-bg">
        <Link href="/home" aria-label="Back to all decks" className="rounded-md p-2 hover:bg-surface"><ArrowLeft size={18} /></Link>
        <span className="hidden lg:inline-flex">
          <Button icon variant="ghost" size="sm" aria-label={rail ? "Hide card list" : "Show card list"} onClick={() => setRail((r) => !r)}>
            {rail ? <PanelLeftClose size={17} /> : <PanelLeft size={17} />}
          </Button>
        </span>
        <label htmlFor="deck-title" className="sr-only">Deck title</label>
        <input id="deck-title" value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)}
          onBlur={() => { const t = title.trim() || "Untitled"; setTitle(t); if (t !== deck.title) void patch({ title: t }); }}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          className="min-w-0 flex-1 sm:flex-none sm:w-72 truncate rounded-md px-2 h-9 font-semibold hover:bg-surface focus-visible:outline-2 focus-visible:outline-focus" />
        <span className={cn("inline-flex items-center gap-1 text-xs shrink-0", d.save === "error" || d.save === "signedOut" ? "text-danger" : "text-text-muted")} role="status" aria-live="polite" data-testid="save-state">
          <SaveIcon size={13} className={d.save === "saving" ? "animate-spin" : undefined} aria-hidden="true" />
          <span className={d.save === "saved" || d.save === "saving" || d.save === "unsaved" ? "sr-only sm:not-sr-only" : undefined}>{saveLabel}</span>
        </span>
        {d.save === "signedOut" && (
          <a href={`/login?next=/decks/${deck.id}`} target="_blank" rel="noopener" className="text-xs font-semibold text-accent underline shrink-0">Sign in again</a>
        )}
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <span className="hidden md:inline-flex"><CreditsMeter credits={credits} /></span>
          <Button variant="ghost" size="sm" onClick={() => setPanel("theme")} aria-label="Theme"><Palette size={16} /><span className="hidden md:inline">Theme</span></Button>
          <Button variant="ghost" size="sm" onClick={() => { setAiCard(null); setPanel("ai"); }} aria-label="Edit with AI"><Sparkles size={16} /><span className="hidden md:inline">AI</span></Button>
          <Button size="sm" onClick={() => setPanel("share")} aria-label="Share"><Share2 size={16} /><span className="hidden sm:inline">Share</span></Button>
          <Button variant="primary" size="sm" onClick={() => setPresenting(active)} aria-label="Present"><Play size={16} /><span className="hidden sm:inline">Present</span></Button>
          <Menu label="More" trigger={<MoreHorizontal size={18} />} items={[
            { label: "Undo", icon: <Undo2 size={15} />, onSelect: () => d.undo() },
            { label: "Redo", icon: <Redo2 size={15} />, onSelect: () => d.redo() },
            { label: "Export", icon: <FileDown size={15} />, onSelect: () => setPanel("export") },
            { label: "Analytics", icon: <BarChart3 size={15} />, onSelect: () => setPanel("analytics") },
            { label: "Duplicate deck", icon: <Copy size={15} />, onSelect: async () => { await d.flush(); const r = await api<{ id: string }>(`/api/decks/${deck.id}/duplicate`, { method: "POST" }); router.push(`/decks/${r.id}`); } },
            { label: "Move to trash", danger: true, icon: <Trash2 size={15} />, onSelect: async () => { await d.flush(); await patch({ archived: true }); toast("Moved to trash", "success"); router.push("/home"); router.refresh(); } },
          ]} />
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        {/* thumbnail rail */}
        {rail && (
          <nav aria-label="Cards" className="no-print hidden lg:flex flex-col gap-2 w-[var(--layout-rail)] shrink-0 border-r border-border bg-bg p-3 overflow-y-auto sticky top-[var(--layout-header)] h-[calc(100dvh-var(--layout-header))]">
            <ol className="flex flex-col gap-2">
              {d.cards.map((c, i) => (
                <li key={c.id} draggable onDragStart={() => setDragFrom(i)} onDragEnd={() => setDragFrom(null)}
                  onDragOver={(e) => e.preventDefault()} onDrop={() => { if (dragFrom !== null) d.moveCard(dragFrom, i); setDragFrom(null); }}
                  className={cn("flex gap-1.5 items-start", dragFrom === i && "opacity-40")}>
                  <span className="w-4 pt-1 text-right text-xs text-text-muted tabular-nums">{i + 1}</span>
                  <button type="button" onClick={() => scrollTo(c.id)} aria-label={`Card ${i + 1}: ${cardTitle(c)}. Alt+arrow keys to move.`} aria-current={active === i || undefined}
                    onKeyDown={(e) => { if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) { e.preventDefault(); d.moveCard(i, i + (e.key === "ArrowUp" ? -1 : 1)); } }}
                    className={cn("flex-1 aspect-video rounded-md overflow-hidden border-2 cursor-grab", active === i ? "border-accent" : "border-border hover:border-border-input")}>
                    <ScaledCard card={c} theme={theme} className="h-full w-full pointer-events-none" />
                  </button>
                </li>
              ))}
            </ol>
            <Button size="sm" variant="ghost" onClick={() => addCard(d.cards.length - 1)} className="mt-1"><Plus size={15} />Add card</Button>
          </nav>
        )}

        {/* canvas */}
        <main className="deck-root flex-1 min-w-0 px-3 sm:px-10 py-8 sm:py-10" style={themeStyle(theme)}>
          <div className="mx-auto max-w-[var(--layout-card-max)] flex flex-col text-[clamp(13px,1.75vw,18px)] sm:pl-[2.6em]">
            {d.cards.map((c, i) => (
              <section key={c.id} ref={(el) => { cardEls.current[c.id] = el; }} data-index={i} aria-label={`Card ${i + 1}`} className="scroll-mt-20 group/card">
                <div className="no-print flex items-center gap-1 mb-1.5 text-[var(--deck-muted)] text-[13px] opacity-70 group-hover/card:opacity-100 focus-within:opacity-100">
                  <span className="mr-1 tabular-nums">{i + 1}</span>
                  <Menu label={`Layout for card ${i + 1}`} align="left" trigger={<LayoutPanelLeft size={16} />} items={(Object.keys(LAYOUT_LABEL) as Layout[]).map((l) => ({
                    label: `${l === c.layout ? "✓ " : ""}${LAYOUT_LABEL[l]}`, onSelect: () => d.setLayout(c.id, l),
                  }))} />
                  <button type="button" className="rounded-md h-8 w-8 grid place-items-center hover:bg-[color-mix(in_srgb,var(--deck-text)_8%,transparent)]" aria-label={`Image for card ${i + 1}`} onClick={() => setImage({ cardId: c.id })}><ImageIcon size={16} /></button>
                  <button type="button" className={cn("rounded-md h-8 w-8 grid place-items-center hover:bg-[color-mix(in_srgb,var(--deck-text)_8%,transparent)]", c.notes && "text-[var(--deck-accent)]")} aria-label={`Speaker notes for card ${i + 1}`} aria-expanded={!!notesOpen[c.id]}
                    onClick={() => setNotesOpen((n) => ({ ...n, [c.id]: !n[c.id] }))}><StickyNote size={16} /></button>
                  <button type="button" className="rounded-md h-8 w-8 grid place-items-center hover:bg-[color-mix(in_srgb,var(--deck-text)_8%,transparent)]" aria-label={`Edit card ${i + 1} with AI`} onClick={() => { setAiCard(c.id); setPanel("ai"); }}><Sparkles size={16} /></button>
                  <Menu label={`More for card ${i + 1}`} align="left" trigger={<MoreHorizontal size={16} />} items={[
                    { label: "Move up", icon: <ArrowUp size={15} />, onSelect: () => d.moveCard(i, i - 1), disabled: i === 0 },
                    { label: "Move down", icon: <ArrowDown size={15} />, onSelect: () => d.moveCard(i, i + 1), disabled: i === d.cards.length - 1 },
                    { label: "Duplicate card", icon: <Copy size={15} />, onSelect: () => d.duplicateCard(c.id) },
                    { label: "Present from here", icon: <Play size={15} />, onSelect: () => setPresenting(i) },
                    { label: "Delete card", danger: true, icon: <Trash2 size={15} />, onSelect: () => d.cards.length > 1 ? d.deleteCard(c.id) : toast("A deck needs at least one card.") },
                  ]} />
                </div>
                <EditableCard card={c} index={i} theme={theme} ops={d} focusKey={focusKey} setFocusKey={setFocusKey}
                  openInsert={(cardId, after, anchor) => setInsert({ cardId, after, anchor })} openImage={setImage} />
                {notesOpen[c.id] && (
                  <div className="no-print mt-2">
                    <label htmlFor={`notes-${c.id}`} className="sr-only">Speaker notes for card {i + 1}</label>
                    <textarea id={`notes-${c.id}`} defaultValue={c.notes} rows={3} placeholder="Speaker notes. Only you see these, in present mode."
                      onChange={(e) => d.setNotes(c.id, e.target.value)}
                      className="w-full rounded-md border border-border bg-bg text-text text-sm p-3 font-[family-name:var(--font-sans)]" />
                  </div>
                )}
                <div className="no-print flex justify-center py-3">
                  <button type="button" onClick={() => addCard(i)} aria-label={`Add a card after card ${i + 1}`}
                    className="inline-flex items-center gap-1 rounded-pill px-3 py-1 text-[13px] text-[var(--deck-muted)] opacity-0 group-hover/card:opacity-100 focus:opacity-100 hover:bg-[color-mix(in_srgb,var(--deck-text)_8%,transparent)]">
                    <Plus size={14} />Add card
                  </button>
                </div>
              </section>
            ))}
          </div>
        </main>
      </div>

      {insert && (
        <InsertMenu anchor={insert.anchor} onClose={() => setInsert(null)} onPick={(b) => {
          const card = d.cards.find((c) => c.id === insert.cardId);
          const after = card?.content.find((x) => x.id === insert.after);
          // "/" on an empty paragraph replaces it
          if (after && after.type === "paragraph" && !after.text.trim()) { d.updateBlock(insert.cardId, after.id, () => ({ ...b, id: after.id })); setFocusKey(`${after.id}:${b.type === "bullets" || b.type === "numbered" ? 0 : ""}`); }
          else { d.insertBlock(insert.cardId, insert.after, b); setFocusKey(`${b.id}:${b.type === "bullets" || b.type === "numbered" ? 0 : ""}`); }
          if (b.type === "image") setImage({ cardId: insert.cardId, blockId: after && after.type === "paragraph" && !after.text.trim() ? after.id : b.id });
          setInsert(null);
        }} />
      )}

      <ThemeDrawer open={panel === "theme"} onClose={() => setPanel(null)} value={themeId} onChange={(k) => { setThemeId(k); void patch({ themeId: k }); }} />
      <AiDrawer open={panel === "ai"} onClose={() => setPanel(null)} deckId={deck.id} cardId={aiCard}
        cardLabel={aiCard ? cardTitle(d.cards.find((c) => c.id === aiCard) ?? d.cards[0]) : null} credits={credits}
        onApplied={async (cards, cr) => { await d.flush(); d.replaceCards(cards); if (typeof cr === "number") setCredits(cr); toast(`Updated ${cards.length} card${cards.length === 1 ? "" : "s"}`, "success"); }} />
      <ShareModal open={panel === "share"} onClose={() => setPanel(null)} slug={deck.slug} access={access} onAccess={(a) => { setAccess(a); void patch({ linkAccess: a }); }} />
      <ExportModal open={panel === "export"} onClose={() => setPanel(null)} deckId={deck.id} onPptx={() => exportPptx(title, d.cards, theme)} />
      <AnalyticsDrawer open={panel === "analytics"} onClose={() => setPanel(null)} deckId={deck.id} shared={access === "view"} />
      <ImageModal open={!!image} onClose={() => setImage(null)} allowArtwork={!image?.blockId}
        onPick={(url, alt, credit = "") => {
          if (!image) return;
          if (image.blockId) { if (url) d.updateBlock(image.cardId, image.blockId, (b) => (b.type === "image" ? { ...b, url, alt, credit: credit || undefined } : b)); }
          else d.setImage(image.cardId, url, alt, credit);
        }} />
      {presenting !== null && <Presenter cards={d.cards} theme={theme} start={presenting} onExit={() => setPresenting(null)} />}
    </div>
  );
}

export type { Card };
