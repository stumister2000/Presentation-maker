"use client";
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Heading1, Heading2, Heading3, Pilcrow, List, ListOrdered, Quote, Info, Image as ImageIcon, Columns3, BarChart3, Minus, MousePointerClick } from "lucide-react";
import { blankBlock, type Block, type BlockType } from "@/lib/blocks";
import { cn } from "@/lib/cn";

interface Item { key: string; label: string; hint: string; icon: React.ElementType; make: () => Block; group: string }

const ITEMS: Item[] = [
  { key: "h1", label: "Title", hint: "Largest heading", icon: Heading1, group: "Text", make: () => ({ ...blankBlock("heading"), level: 1 }) as Block },
  { key: "h2", label: "Heading", hint: "Section heading", icon: Heading2, group: "Text", make: () => blankBlock("heading") },
  { key: "h3", label: "Subheading", hint: "Small heading", icon: Heading3, group: "Text", make: () => ({ ...blankBlock("heading"), level: 3 }) as Block },
  { key: "p", label: "Text", hint: "Plain paragraph", icon: Pilcrow, group: "Text", make: () => blankBlock("paragraph") },
  { key: "ul", label: "Bulleted list", hint: "Simple list", icon: List, group: "Text", make: () => blankBlock("bullets") },
  { key: "ol", label: "Numbered list", hint: "Steps in order", icon: ListOrdered, group: "Text", make: () => blankBlock("numbered") },
  { key: "quote", label: "Quote", hint: "Pull quote with source", icon: Quote, group: "Text", make: () => blankBlock("quote") },
  { key: "callout", label: "Callout", hint: "Highlight a note or tip", icon: Info, group: "Text", make: () => blankBlock("callout") },
  { key: "columns", label: "Columns", hint: "Side-by-side points", icon: Columns3, group: "Layout", make: () => blankBlock("columns") },
  { key: "stats", label: "Big numbers", hint: "Key figures with labels", icon: BarChart3, group: "Layout", make: () => blankBlock("stats") },
  { key: "divider", label: "Divider", hint: "A thin line", icon: Minus, group: "Layout", make: () => blankBlock("divider") },
  { key: "image", label: "Image", hint: "Photo from a link", icon: ImageIcon, group: "Media", make: () => blankBlock("image") },
  { key: "button", label: "Button", hint: "Link styled as a button", icon: MousePointerClick, group: "Media", make: () => blankBlock("button") },
];

export function InsertMenu({ anchor, onPick, onClose }: { anchor: HTMLElement; onPick: (b: Block, type: BlockType) => void; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const box = useRef<HTMLDivElement>(null);
  const lid = useId();
  const items = useMemo(() => ITEMS.filter((i) => (i.label + " " + i.hint).toLowerCase().includes(q.toLowerCase())), [q]);

  useLayoutEffect(() => {
    const r = anchor.getBoundingClientRect();
    const h = 360, w = 280;
    setPos({ top: r.bottom + h > window.innerHeight ? Math.max(8, r.top - h) : r.bottom + 4, left: Math.min(Math.max(8, r.left), window.innerWidth - w - 8) });
  }, [anchor]);
  useEffect(() => {
    const close = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) onClose(); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [onClose]);
  useEffect(() => setActive(0), [q]);

  function pick(i: Item) { onPick(i.make(), i.make().type); }

  return (
    <div ref={box} className="animate-rise fixed z-50 w-[280px] rounded-lg border border-border bg-bg shadow-pop p-1.5" style={pos}>
      <label htmlFor={`${lid}-q`} className="sr-only">Search blocks</label>
      <input id={`${lid}-q`} autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search blocks…"
        role="combobox" aria-expanded="true" aria-controls={lid} aria-activedescendant={items[active] ? `${lid}-${items[active].key}` : undefined}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(items.length - 1, a + 1)); }
          if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
          if (e.key === "Enter" && items[active]) { e.preventDefault(); pick(items[active]); }
          if (e.key === "Escape") { e.preventDefault(); onClose(); }
        }}
        className="w-full h-9 rounded-md bg-surface px-3 text-sm focus:outline-none mb-1" />
      <ul id={lid} role="listbox" aria-label="Blocks" className="max-h-[300px] overflow-y-auto">
        {items.length === 0 && <li className="px-3 py-6 text-center text-sm text-text-muted">No block called “{q}”.</li>}
        {items.map((it, i) => (
          <li key={it.key} id={`${lid}-${it.key}`} role="option" aria-selected={i === active}
            onMouseEnter={() => setActive(i)} onMouseDown={(e) => { e.preventDefault(); pick(it); }}
            className={cn("flex items-center gap-3 rounded-md px-2.5 py-2 cursor-pointer", i === active && "bg-surface")}>
            <span className="grid h-8 w-8 place-items-center rounded-md border border-border bg-bg"><it.icon size={16} aria-hidden="true" /></span>
            <span><span className="block text-sm font-medium">{it.label}</span><span className="block text-xs text-text-muted">{it.hint}</span></span>
          </li>
        ))}
      </ul>
    </div>
  );
}
