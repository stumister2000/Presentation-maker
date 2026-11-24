import { z } from "zod";

// The card content model. Text fields hold plain text with two inline marks:
// **bold** and *italic*, plus [label](https://url) links. Never raw HTML.

const id = z.string().min(1).max(64);
const text = z.string().max(4000);
const short = z.string().max(400);

export const BlockSchema = z.discriminatedUnion("type", [
  z.object({ id, type: z.literal("heading"), level: z.union([z.literal(1), z.literal(2), z.literal(3)]), text: short }),
  z.object({ id, type: z.literal("paragraph"), text }),
  z.object({ id, type: z.literal("bullets"), items: z.array(short).max(12) }),
  z.object({ id, type: z.literal("numbered"), items: z.array(short).max(12) }),
  z.object({ id, type: z.literal("quote"), text, cite: short.optional() }),
  z.object({ id, type: z.literal("callout"), tone: z.enum(["info", "tip", "warning"]), text }),
  z.object({ id, type: z.literal("image"), url: z.string().url().max(2000), alt: short, credit: short.optional() }),
  z.object({ id, type: z.literal("columns"), columns: z.array(z.object({ title: short, text })).min(2).max(4) }),
  z.object({ id, type: z.literal("stats"), items: z.array(z.object({ value: z.string().max(24), label: short })).min(1).max(4) }),
  z.object({ id, type: z.literal("divider") }),
  z.object({ id, type: z.literal("button"), label: z.string().max(60), href: z.string().max(2000) }),
]);
export type Block = z.infer<typeof BlockSchema>;
export type BlockType = Block["type"];

export const LAYOUTS = ["none", "accent_left", "accent_right", "accent_top", "background"] as const;
export type Layout = (typeof LAYOUTS)[number];

export const CardSchema = z.object({
  id,
  layout: z.enum(LAYOUTS),
  imageUrl: z.string().max(2000).nullable(),
  imageAlt: z.string().max(400),
  content: z.array(BlockSchema).max(40),
  notes: z.string().max(8000),
});
export type Card = z.infer<typeof CardSchema>;

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function blankBlock(type: BlockType): Block {
  const b = { id: newId() };
  switch (type) {
    case "heading": return { ...b, type, level: 2, text: "" };
    case "paragraph": return { ...b, type, text: "" };
    case "bullets": return { ...b, type, items: [""] };
    case "numbered": return { ...b, type, items: [""] };
    case "quote": return { ...b, type, text: "" };
    case "callout": return { ...b, type, tone: "info", text: "" };
    case "image": return { ...b, type, url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200", alt: "" };
    case "columns": return { ...b, type, columns: [{ title: "", text: "" }, { title: "", text: "" }] };
    case "stats": return { ...b, type, items: [{ value: "", label: "" }, { value: "", label: "" }] };
    case "divider": return { ...b, type };
    case "button": return { ...b, type, label: "Learn more", href: "https://" };
  }
}

export function blankCard(title = ""): Card {
  return {
    id: newId(),
    layout: "none",
    imageUrl: null,
    imageAlt: "",
    content: [{ id: newId(), type: "heading", level: 1, text: title }, { id: newId(), type: "paragraph", text: "" }],
    notes: "",
  };
}

/** Accepts model output or client input; drops invalid blocks instead of failing the card. */
export function sanitizeCard(raw: unknown): Card | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const content = Array.isArray(r.content) ? r.content : [];
  const blocks: Block[] = [];
  for (const c of content) {
    const withId = c && typeof c === "object" && !("id" in c) ? { ...(c as object), id: newId() } : c;
    const p = BlockSchema.safeParse(withId);
    if (p.success) blocks.push(p.data);
  }
  const layout = LAYOUTS.includes(r.layout as Layout) ? (r.layout as Layout) : "none";
  const imageUrl = typeof r.imageUrl === "string" && isSafeUrl(r.imageUrl) ? r.imageUrl : null;
  return {
    id: typeof r.id === "string" && r.id.length <= 64 && r.id ? r.id : newId(),
    layout,
    imageUrl,
    imageAlt: typeof r.imageAlt === "string" ? r.imageAlt.slice(0, 400) : "",
    content: blocks.slice(0, 40),
    notes: typeof r.notes === "string" ? r.notes.slice(0, 8000) : "",
  };
}

export function isSafeUrl(u: string): boolean {
  try {
    const url = new URL(u);
    return url.protocol === "https:" || (url.protocol === "http:" && url.hostname === "localhost");
  } catch {
    return u.startsWith("/") && !u.startsWith("//");
  }
}

/** Title of a card = first heading's text, else first text. */
export function cardTitle(card: Card): string {
  for (const b of card.content) if (b.type === "heading" && b.text.trim()) return stripMarks(b.text);
  for (const b of card.content) if ("text" in b && b.text.trim()) return stripMarks(b.text).slice(0, 80);
  return "Untitled card";
}

export function stripMarks(s: string): string {
  return s.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1").replace(/\[(.+?)\]\((.+?)\)/g, "$1");
}

/** Plain-text dump of a card, used for AI context and PPTX notes. */
export function cardToText(card: Card): string {
  const out: string[] = [];
  for (const b of card.content) {
    switch (b.type) {
      case "heading": out.push(`${"#".repeat(b.level)} ${b.text}`); break;
      case "paragraph": case "quote": case "callout": out.push(b.text); break;
      case "bullets": out.push(...b.items.map((i) => `- ${i}`)); break;
      case "numbered": out.push(...b.items.map((i, n) => `${n + 1}. ${i}`)); break;
      case "columns": out.push(...b.columns.map((c) => `${c.title}: ${c.text}`)); break;
      case "stats": out.push(...b.items.map((s) => `${s.value} ${s.label}`)); break;
      case "button": out.push(`[${b.label}]`); break;
      default: break;
    }
  }
  return out.join("\n");
}
