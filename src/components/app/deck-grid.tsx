"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { MoreHorizontal, Copy, Star, StarOff, Trash2, RotateCcw, Pencil, Search, Inbox, Sparkles } from "lucide-react";
import { ScaledCard } from "@/components/deck/scaled-card";
import { Menu, type MenuItem } from "@/components/ui/menu";
import { EmptyState } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { getTheme, withScale } from "@/lib/themes";
import { api, timeAgo } from "@/lib/api";
import { blankCard } from "@/lib/blocks";
import type { DeckSummary } from "@/server/queries";

export function DeckGrid({ decks: initial, view }: { decks: DeckSummary[]; view: "all" | "favorites" | "trash" }) {
  const [decks, setDecks] = useState(initial);
  const [query, setQuery] = useState("");
  const [renaming, setRenaming] = useState<DeckSummary | null>(null);
  const router = useRouter();
  const toast = useToast();
  const shown = useMemo(() => decks.filter((d) => d.title.toLowerCase().includes(query.toLowerCase())), [decks, query]);

  async function patch(d: DeckSummary, body: object, msg: string, removeFromView = false) {
    try {
      await api(`/api/decks/${d.id}`, { method: "PATCH", json: body });
      setDecks((xs) => removeFromView ? xs.filter((x) => x.id !== d.id) : xs.map((x) => (x.id === d.id ? { ...x, ...body } : x)));
      toast(msg, "success");
      router.refresh();
    } catch (e) { toast((e as Error).message, "error"); }
  }

  function itemsFor(d: DeckSummary): MenuItem[] {
    if (view === "trash") return [
      { label: "Restore", icon: <RotateCcw size={15} />, onSelect: () => patch(d, { archived: false }, "Restored", true) },
      { label: "Delete forever", danger: true, icon: <Trash2 size={15} />, onSelect: async () => {
        if (!confirm(`Delete “${d.title}” forever? This cannot be undone.`)) return;
        try { await api(`/api/decks/${d.id}`, { method: "DELETE" }); setDecks((xs) => xs.filter((x) => x.id !== d.id)); toast("Deleted", "success"); }
        catch (e) { toast((e as Error).message, "error"); }
      } },
    ];
    return [
      { label: "Rename", icon: <Pencil size={15} />, onSelect: () => setRenaming(d) },
      { label: "Duplicate", icon: <Copy size={15} />, onSelect: async () => {
        try { const r = await api<{ id: string }>(`/api/decks/${d.id}/duplicate`, { method: "POST" }); toast("Copy created", "success"); router.push(`/decks/${r.id}`); }
        catch (e) { toast((e as Error).message, "error"); }
      } },
      d.isFavorite
        ? { label: "Remove from favourites", icon: <StarOff size={15} />, onSelect: () => patch(d, { isFavorite: false }, "Removed from favourites", view === "favorites") }
        : { label: "Add to favourites", icon: <Star size={15} />, onSelect: () => patch(d, { isFavorite: true }, "Added to favourites") },
      { label: "Move to trash", danger: true, icon: <Trash2 size={15} />, onSelect: () => patch(d, { archived: true }, "Moved to trash", true) },
    ];
  }

  async function blank() {
    const r = await api<{ id: string }>("/api/decks", { json: { title: "Untitled", cards: [blankCard("")] } });
    router.push(`/decks/${r.id}`);
  }

  const title = view === "trash" ? "Trash" : view === "favorites" ? "Favourites" : "All decks";

  return (
    <div className="mx-auto max-w-[var(--layout-content-max)]">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <h1 className="text-xl font-bold mr-auto">{title}</h1>
        {decks.length > 0 && (
          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden="true" />
            <label htmlFor="deck-search" className="sr-only">Search decks</label>
            <input id="deck-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search"
              className="h-9 w-full rounded-md border border-border bg-bg pl-9 pr-3 text-sm focus-visible:outline-2 focus-visible:outline-focus" />
          </div>
        )}
        {view === "all" && <Button onClick={blank}>Blank deck</Button>}
      </div>
      {view === "trash" && decks.length > 0 && <p className="text-sm text-text-muted -mt-3 mb-5">Decks in the trash are deleted for good after 30 days.</p>}

      {decks.length === 0 ? (
        view === "all" ? (
          <EmptyState icon={<Sparkles size={34} />} title="Your first deck is one sentence away"
            body="Describe what you need and get a designed, editable presentation in about a minute."
            action={<Link href="/create/generate" className="inline-flex h-10 items-center rounded-md bg-accent px-4 text-sm font-semibold text-on-accent hover:bg-accent-hover">Create with AI</Link>} />
        ) : (
          <EmptyState icon={<Inbox size={32} />} title={view === "trash" ? "The trash is empty" : "No favourites yet"}
            body={view === "trash" ? "Decks you delete land here first, so you can change your mind." : "Star a deck from its menu to keep it close."} />
        )
      ) : shown.length === 0 ? (
        <p className="text-text-muted py-12 text-center">No decks match “{query}”.</p>
      ) : (
        <ul className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shown.map((d) => (
            <li key={d.id} className="group relative rounded-lg border border-border bg-bg hover:shadow-pop transition-shadow focus-within:shadow-pop">
              <Link href={view === "trash" ? "#" : `/decks/${d.id}`} aria-disabled={view === "trash"} className="block rounded-lg focus-visible:outline-2 focus-visible:outline-focus"
                onClick={(e) => view === "trash" && e.preventDefault()}>
                <div className="aspect-[16/10] rounded-t-lg overflow-hidden border-b border-border">
                  {d.firstCard ? <ScaledCard card={d.firstCard} theme={withScale(getTheme(d.themeId), d.textScale)} className="h-full w-full" />
                    : <div className="h-full w-full bg-surface" />}
                </div>
                <div className="px-3.5 py-3 pr-12">
                  <div className="font-semibold truncate" title={d.title}>{d.title}</div>
                  <div className="text-xs text-text-muted mt-0.5">{d.cardCount} cards · edited {timeAgo(d.updatedAt)}</div>
                </div>
              </Link>
              {d.isFavorite && view !== "trash" && <Star size={16} className="absolute top-2.5 right-2.5 fill-warning text-warning" aria-label="Favourite" />}
              <Menu label={`Actions for ${d.title}`} trigger={<MoreHorizontal size={18} />} items={itemsFor(d)} className="!absolute bottom-3 right-2" />
            </li>
          ))}
        </ul>
      )}

      <RenameModal deck={renaming} onClose={() => setRenaming(null)} onSave={(d, t) => patch(d, { title: t }, "Renamed")} />
    </div>
  );
}

function RenameModal({ deck, onClose, onSave }: { deck: DeckSummary | null; onClose: () => void; onSave: (d: DeckSummary, t: string) => void }) {
  return (
    <Modal open={!!deck} onClose={onClose} title="Rename deck" size="sm">
      {deck && (
        <form onSubmit={(e) => { e.preventDefault(); const t = String(new FormData(e.currentTarget).get("title")).trim(); if (t) { onSave(deck, t); onClose(); } }} className="flex flex-col gap-4">
          <TextField label="Title" name="title" defaultValue={deck.title} maxLength={200} autoFocus />
          <div className="flex justify-end gap-2"><Button onClick={onClose}>Cancel</Button><Button type="submit" variant="primary">Save</Button></div>
        </form>
      )}
    </Modal>
  );
}
