"use client";
import { Plus, MoreHorizontal, ArrowUp, ArrowDown, Copy, Trash2, Info, Lightbulb, TriangleAlert, ImageIcon, Link2, X } from "lucide-react";
import { CardFrame } from "@/components/deck/card-view";
import { Menu } from "@/components/ui/menu";
import { EditableText } from "./editable-text";
import { blankBlock, newId, type Block, type Card } from "@/lib/blocks";
import type { DeckTheme } from "@/lib/themes";
import type { DeckOps } from "./use-deck";
import { cn } from "@/lib/cn";

export interface FocusTarget { key: string }

interface Props {
  card: Card;
  index: number;
  theme: DeckTheme;
  ops: DeckOps;
  focusKey: string | null;
  setFocusKey: (k: string | null) => void;
  openInsert: (cardId: string, afterBlockId: string | null, anchor: HTMLElement) => void;
  openImage: (target: { cardId: string; blockId?: string }) => void;
}

const calloutTones = { info: Info, tip: Lightbulb, warning: TriangleAlert } as const;
const nextTone = { info: "tip", tip: "warning", warning: "info" } as const;

export function EditableCard({ card, index, theme, ops, focusKey, setFocusKey, openInsert, openImage }: Props) {
  const fk = (blockId: string, part: string | number = "") => `${blockId}:${part}`;

  function addParagraphAfter(blockId: string, text = "") {
    const b: Block = { id: newId(), type: "paragraph", text };
    ops.insertBlock(card.id, blockId, b);
    setFocusKey(fk(b.id));
  }

  function textProps(b: Block, part: string | number, value: string, onCommit: (v: string) => void, label: string) {
    return {
      value, onCommit, label: `${label}, card ${index + 1}`,
      autoFocus: focusKey === fk(b.id, part),
      onFocused: () => setFocusKey(null),
    };
  }

  function renderBlock(b: Block) {
    const up = (fn: (x: Block) => Block) => ops.updateBlock(card.id, b.id, fn);
    switch (b.type) {
      case "heading": {
        const cls = b.level === 1 ? "text-[2.6em] leading-[1.08] font-semibold" : b.level === 2 ? "text-[1.7em] leading-tight font-semibold" : "text-[1.25em] font-semibold";
        return <EditableText tag={`h${b.level}` as "h1"} className={cls} placeholder="Heading"
          {...textProps(b, "", b.text, (v) => up((x) => ({ ...x, text: v })), "Heading")}
          onEnter={(_, after) => addParagraphAfter(b.id, after)}
          onBackspaceEmpty={() => ops.deleteBlock(card.id, b.id)} />;
      }
      case "paragraph":
        return <EditableText tag="p" className="text-[1.05em] leading-relaxed" placeholder="Type, or press / for blocks"
          {...textProps(b, "", b.text, (v) => up((x) => ({ ...x, text: v })), "Paragraph")}
          onEnter={(_, after) => addParagraphAfter(b.id, after)}
          onBackspaceEmpty={() => ops.deleteBlock(card.id, b.id)}
          onSlash={(el) => openInsert(card.id, b.id, el)} />;
      case "bullets":
      case "numbered": {
        const List = b.type === "bullets" ? "ul" : "ol";
        return (
          <List className={cn("pl-[1.3em] space-y-[0.4em] text-[1.05em]", b.type === "bullets" ? "list-disc marker:text-[var(--deck-accent)]" : "list-decimal marker:font-semibold marker:text-[var(--deck-accent)]")}>
            {b.items.map((item, i) => (
              <li key={i}>
                <EditableText tag="span" className="block" placeholder="List item"
                  {...textProps(b, i, item, (v) => up((x) => ("items" in x && Array.isArray(x.items) ? { ...x, items: (x.items as string[]).map((y, k) => (k === i ? v : y)) } : x) as Block), "List item")}
                  onEnter={(_, after) => { up((x) => ({ ...x, items: [...(x as typeof b).items.slice(0, i + 1), after, ...(x as typeof b).items.slice(i + 1)] }) as Block); setFocusKey(fk(b.id, i + 1)); }}
                  onBackspaceEmpty={() => {
                    if (b.items.length <= 1) { ops.deleteBlock(card.id, b.id); return; }
                    up((x) => ({ ...x, items: (x as typeof b).items.filter((_, k) => k !== i) }) as Block);
                    setFocusKey(fk(b.id, Math.max(0, i - 1)));
                  }} />
              </li>
            ))}
          </List>
        );
      }
      case "quote":
        return (
          <blockquote className="border-l-4 border-[var(--deck-accent)] pl-[1em] text-[1.3em] leading-snug italic">
            <EditableText placeholder="A line worth quoting" multiline {...textProps(b, "", b.text, (v) => up((x) => ({ ...x, text: v })), "Quote")} />
            <EditableText className="deck-muted mt-2 text-[0.7em] not-italic" placeholder="Who said it (optional)"
              {...textProps(b, "cite", b.cite ?? "", (v) => up((x) => ({ ...x, cite: v || undefined })), "Quote source")} />
          </blockquote>
        );
      case "callout": {
        const Icon = calloutTones[b.tone];
        return (
          <div className="flex gap-3 rounded-[var(--radius-md)] p-[1em] bg-[color-mix(in_srgb,var(--deck-accent)_12%,transparent)]">
            <button type="button" className="deck-accent shrink-0 mt-[0.15em] rounded" aria-label={`Callout style: ${b.tone}. Change style`}
              onClick={() => up((x) => ({ ...x, tone: nextTone[(x as typeof b).tone] }) as Block)}><Icon size={20} /></button>
            <EditableText className="flex-1 leading-relaxed" placeholder="Something to call out" multiline {...textProps(b, "", b.text, (v) => up((x) => ({ ...x, text: v })), "Callout")} />
          </div>
        );
      }
      case "image":
        return (
          <figure className="relative group/img">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={b.url} alt={b.alt} className="w-full rounded-[var(--radius-md)] object-cover max-h-[22em]" />
            <button type="button" onClick={() => openImage({ cardId: card.id, blockId: b.id })}
              className="absolute top-2 right-2 rounded-md bg-black/60 text-white text-sm px-2.5 py-1 opacity-0 group-hover/img:opacity-100 focus:opacity-100">Replace</button>
            <EditableText tag="span" className="deck-muted mt-1 block text-[0.75em]" placeholder="Describe the image for screen readers"
              {...textProps(b, "alt", b.alt, (v) => up((x) => ({ ...x, alt: v })), "Image description")} />
          </figure>
        );
      case "columns":
        return (
          <div className="grid gap-[1.2em]" style={{ gridTemplateColumns: `repeat(${b.columns.length}, minmax(0, 1fr))` }}>
            {b.columns.map((c, i) => (
              <div key={i} className="relative group/col rounded-[var(--radius-md)] p-[1em] bg-[color-mix(in_srgb,var(--deck-text)_5%,transparent)]">
                <EditableText tag="h3" className="text-[1.15em] font-semibold mb-[0.3em]" placeholder="Column title"
                  {...textProps(b, `t${i}`, c.title, (v) => up((x) => ({ ...x, columns: (x as typeof b).columns.map((y, k) => (k === i ? { ...y, title: v } : y)) }) as Block), "Column title")} />
                <EditableText className="deck-muted leading-relaxed text-[0.95em]" placeholder="Column text" multiline
                  {...textProps(b, `x${i}`, c.text, (v) => up((x) => ({ ...x, columns: (x as typeof b).columns.map((y, k) => (k === i ? { ...y, text: v } : y)) }) as Block), "Column text")} />
                {b.columns.length > 2 && (
                  <button type="button" aria-label={`Remove column ${i + 1}`} onClick={() => up((x) => ({ ...x, columns: (x as typeof b).columns.filter((_, k) => k !== i) }) as Block)}
                    className="absolute top-1 right-1 rounded p-0.5 opacity-0 group-hover/col:opacity-70 focus:opacity-100"><X size={14} /></button>
                )}
              </div>
            ))}
          </div>
        );
      case "stats":
        return (
          <div className="grid gap-[1.2em]" style={{ gridTemplateColumns: `repeat(${b.items.length}, minmax(0, 1fr))` }}>
            {b.items.map((s, i) => (
              <div key={i}>
                <EditableText className="deck-accent text-[2.4em] font-semibold leading-none" placeholder="42%"
                  {...textProps(b, `v${i}`, s.value, (v) => up((x) => ({ ...x, items: (x as typeof b).items.map((y, k) => (k === i ? { ...y, value: v.slice(0, 24) } : y)) }) as Block), "Number")} />
                <EditableText className="deck-muted mt-[0.4em] text-[0.95em]" placeholder="What it measures"
                  {...textProps(b, `l${i}`, s.label, (v) => up((x) => ({ ...x, items: (x as typeof b).items.map((y, k) => (k === i ? { ...y, label: v } : y)) }) as Block), "Number label")} />
              </div>
            ))}
          </div>
        );
      case "divider":
        return <hr className="border-0 h-px my-[0.4em] bg-[color-mix(in_srgb,var(--deck-text)_15%,transparent)]" />;
      case "button":
        return (
          <div className="flex items-center gap-2">
            <span className="inline-flex rounded-[var(--radius-md)] px-[1.2em] py-[0.6em] font-semibold bg-[var(--deck-accent)] text-[var(--deck-card)]">
              <EditableText tag="span" placeholder="Button label" {...textProps(b, "", b.label, (v) => up((x) => ({ ...x, label: v.slice(0, 60) })), "Button label")} />
            </span>
            <button type="button" className="deck-muted text-[0.8em] inline-flex items-center gap-1 rounded px-1 hover:underline" onClick={() => {
              const href = prompt("Where should the button go? (https://…)", b.href);
              if (href !== null) up((x) => ({ ...x, href: href.trim() }));
            }}><Link2 size={14} aria-hidden="true" />{b.href.replace(/^https?:\/\//, "").slice(0, 30) || "Add link"}</button>
          </div>
        );
    }
  }

  return (
    <CardFrame card={card} theme={theme}>
      {card.content.map((b, i) => (
        <div key={b.id} className="group/block relative" data-block={b.type}>
          <div className="no-print absolute -left-[2.6em] top-0 hidden sm:flex flex-col items-center opacity-0 group-hover/block:opacity-100 group-focus-within/block:opacity-100 text-[var(--deck-muted)]">
            <button type="button" aria-label="Add a block below" onClick={(e) => openInsert(card.id, b.id, e.currentTarget)}
              className="rounded p-1 hover:bg-[color-mix(in_srgb,var(--deck-text)_8%,transparent)]"><Plus size={16} /></button>
            <BlockMenu onMove={(d) => ops.moveBlock(card.id, b.id, d)} first={i === 0} last={i === card.content.length - 1}
              onDuplicate={() => ops.duplicateBlock(card.id, b.id)} onDelete={() => ops.deleteBlock(card.id, b.id)}
              onTurnInto={b.type === "paragraph" || b.type === "heading" || b.type === "bullets" ? (t) => ops.updateBlock(card.id, b.id, (x) => convert(x, t)) : undefined} />
          </div>
          {renderBlock(b)}
        </div>
      ))}
      {card.content.length === 0 && (
        <button type="button" onClick={() => { const nb = blankBlock("paragraph"); ops.insertBlock(card.id, null, nb); setFocusKey(`${nb.id}:`); }}
          className="deck-muted text-left hover:underline">Empty card. Click to start typing.</button>
      )}
      {card.layout !== "none" && !card.imageUrl && (
        <button type="button" onClick={() => openImage({ cardId: card.id })} className="no-print deck-muted self-start inline-flex items-center gap-1.5 text-[0.8em] hover:underline">
          <ImageIcon size={14} aria-hidden="true" />Use a photo instead of artwork
        </button>
      )}
    </CardFrame>
  );
}

function convert(b: Block, to: "heading" | "paragraph" | "bullets"): Block {
  const text = b.type === "bullets" ? b.items.join(" ") : "text" in b ? (b as { text: string }).text : "";
  if (to === "heading") return { id: b.id, type: "heading", level: 2, text };
  if (to === "paragraph") return { id: b.id, type: "paragraph", text };
  return { id: b.id, type: "bullets", items: b.type === "bullets" ? b.items : text.split(/(?<=[.!?])\s+/).filter(Boolean) };
}

function BlockMenu({ onMove, onDuplicate, onDelete, onTurnInto, first, last }: {
  onMove: (d: -1 | 1) => void; onDuplicate: () => void; onDelete: () => void; onTurnInto?: (t: "heading" | "paragraph" | "bullets") => void; first: boolean; last: boolean;
}) {
  return (
    <Menu label="Block options" align="left" trigger={<MoreHorizontal size={16} />} items={[
      { label: "Move up", icon: <ArrowUp size={15} />, onSelect: () => onMove(-1), disabled: first },
      { label: "Move down", icon: <ArrowDown size={15} />, onSelect: () => onMove(1), disabled: last },
      { label: "Duplicate", icon: <Copy size={15} />, onSelect: onDuplicate },
      ...(onTurnInto ? [
        { label: "Turn into heading", onSelect: () => onTurnInto("heading") },
        { label: "Turn into text", onSelect: () => onTurnInto("paragraph") },
        { label: "Turn into bullets", onSelect: () => onTurnInto("bullets") },
      ] : []),
      { label: "Delete block", danger: true, icon: <Trash2 size={15} />, onSelect: onDelete },
    ]} />
  );
}
