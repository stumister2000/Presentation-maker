"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { newId, type Block, type Card, type Layout } from "@/lib/blocks";

export type SaveState = "saved" | "saving" | "unsaved" | "error";

/**
 * Card state for the editor: undo/redo history and debounced autosave.
 * Cards live in a ref (source of truth) mirrored into React state for render.
 */
export function useDeckCards(deckId: string, initial: Card[]) {
  const ref = useRef<Card[]>(initial);
  const [cards, setCards] = useState<Card[]>(initial);
  const past = useRef<Card[][]>([]);
  const future = useRef<Card[][]>([]);
  const lastPush = useRef(0);
  const [save, setSave] = useState<SaveState>("saved");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inflight = useRef(false);
  const dirty = useRef(false);

  const flush = useCallback(async () => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    if (inflight.current) { dirty.current = true; return; }
    inflight.current = true;
    dirty.current = false;
    setSave("saving");
    try {
      const res = await fetch(`/api/decks/${deckId}/cards`, {
        method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ cards: ref.current }), keepalive: true,
      });
      if (!res.ok) throw new Error(String(res.status));
      setSave(dirty.current ? "unsaved" : "saved");
    } catch {
      setSave("error");
      dirty.current = true;
      timer.current = setTimeout(() => void flush(), 3000);
    } finally {
      inflight.current = false;
      if (dirty.current && !timer.current) timer.current = setTimeout(() => void flush(), 400);
    }
  }, [deckId]);

  const schedule = useCallback(() => {
    setSave("unsaved");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), 700);
  }, [flush]);

  const commit = useCallback((next: Card[], coalesce = false) => {
    const prev = ref.current;
    if (next === prev) return;
    const now = Date.now();
    if (!(coalesce && now - lastPush.current < 1200)) {
      past.current.push(prev);
      if (past.current.length > 100) past.current.shift();
    }
    lastPush.current = now;
    future.current = [];
    ref.current = next;
    setCards(next);
    schedule();
  }, [schedule]);

  const update = useCallback((fn: (c: Card[]) => Card[], coalesce = false) => commit(fn(ref.current), coalesce), [commit]);

  const undo = useCallback(() => {
    const p = past.current.pop();
    if (!p) return false;
    future.current.push(ref.current);
    ref.current = p;
    setCards(p);
    schedule();
    return true;
  }, [schedule]);
  const redo = useCallback(() => {
    const f = future.current.pop();
    if (!f) return false;
    past.current.push(ref.current);
    ref.current = f;
    setCards(f);
    schedule();
    return true;
  }, [schedule]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (timer.current || inflight.current) { void flush(); e.preventDefault(); }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [flush]);

  /* ----- card operations ----- */
  const ops = {
    updateCard: (id: string, fn: (c: Card) => Card, coalesce = false) => update((cs) => cs.map((c) => (c.id === id ? fn(c) : c)), coalesce),
    insertCard: (afterIndex: number, card: Card) => update((cs) => [...cs.slice(0, afterIndex + 1), card, ...cs.slice(afterIndex + 1)]),
    duplicateCard: (id: string) => update((cs) => {
      const i = cs.findIndex((c) => c.id === id);
      const copy: Card = { ...cs[i], id: newId(), content: cs[i].content.map((b) => ({ ...b, id: newId() })) };
      return [...cs.slice(0, i + 1), copy, ...cs.slice(i + 1)];
    }),
    deleteCard: (id: string) => update((cs) => (cs.length <= 1 ? cs : cs.filter((c) => c.id !== id))),
    moveCard: (from: number, to: number) => update((cs) => {
      if (to < 0 || to >= cs.length || from === to) return cs;
      const c = [...cs];
      const [x] = c.splice(from, 1);
      c.splice(to, 0, x);
      return c;
    }),
    setLayout: (id: string, layout: Layout) => ops.updateCard(id, (c) => ({ ...c, layout })),
    setImage: (id: string, imageUrl: string | null, imageAlt = "") => ops.updateCard(id, (c) => ({ ...c, imageUrl, imageAlt, layout: imageUrl && c.layout === "none" ? "accent_right" : c.layout })),
    setNotes: (id: string, notes: string) => ops.updateCard(id, (c) => ({ ...c, notes }), true),
    replaceCards: (edited: Card[]) => update((cs) => cs.map((c) => edited.find((e) => e.id === c.id) ?? c)),

    /* ----- block operations ----- */
    updateBlock: (cardId: string, blockId: string, fn: (b: Block) => Block) =>
      ops.updateCard(cardId, (c) => ({ ...c, content: c.content.map((b) => (b.id === blockId ? fn(b) : b)) }), true),
    insertBlock: (cardId: string, afterBlockId: string | null, block: Block) =>
      ops.updateCard(cardId, (c) => {
        const i = afterBlockId ? c.content.findIndex((b) => b.id === afterBlockId) : c.content.length - 1;
        return { ...c, content: [...c.content.slice(0, i + 1), block, ...c.content.slice(i + 1)] };
      }),
    deleteBlock: (cardId: string, blockId: string) => ops.updateCard(cardId, (c) => ({ ...c, content: c.content.filter((b) => b.id !== blockId) })),
    duplicateBlock: (cardId: string, blockId: string) => ops.updateCard(cardId, (c) => {
      const i = c.content.findIndex((b) => b.id === blockId);
      return { ...c, content: [...c.content.slice(0, i + 1), { ...c.content[i], id: newId() }, ...c.content.slice(i + 1)] };
    }),
    moveBlock: (cardId: string, blockId: string, dir: -1 | 1) => ops.updateCard(cardId, (c) => {
      const i = c.content.findIndex((b) => b.id === blockId), j = i + dir;
      if (j < 0 || j >= c.content.length) return c;
      const content = [...c.content];
      [content[i], content[j]] = [content[j], content[i]];
      return { ...c, content };
    }),
  };

  return { cards, save, flush, undo, redo, ...ops };
}
export type DeckOps = ReturnType<typeof useDeckCards>;
