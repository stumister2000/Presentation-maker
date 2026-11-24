import "server-only";
import { newId, type Block, type Card, type Layout } from "@/lib/blocks";
import type { GenSettings, OutlineItem } from "@/lib/generation";
import type { DeckEngine } from "./types";

// Offline drafting engine. Deterministic, no network, no key. It structures
// the user's own words (paste mode) or scaffolds a topic (prompt mode). Used in
// development, in tests, and as the fallback when no AI key is configured.

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const pace = () => sleep(process.env.NODE_ENV === "test" || process.env.FAST_AI ? 0 : 60);

function cleanTopic(prompt: string): string {
  let t = prompt.trim().replace(/\s+/g, " ").replace(/[.?!]+$/, "");
  t = t.replace(/^(make|create|build|write|generate|give me|i need|please)\s+(me\s+)?(a|an)?\s*(presentation|deck|pitch deck|slides?|talk|document)\s*(about|on|for)?\s*/i, "");
  return t ? t[0].toUpperCase() + t.slice(1) : "Your topic";
}

const SECTIONS: Array<{ title: (t: string) => string; bullets: (t: string) => string[] }> = [
  { title: (t) => t, bullets: (t) => [`What ${t.toLowerCase()} is and why it matters now`, "The story in three parts: context, plan, results"] },
  { title: () => "Why this matters", bullets: () => ["The cost of doing nothing keeps growing", "People already feel the pain every week", "The timing is right: tools and habits have shifted"] },
  { title: () => "Where things stand today", bullets: () => ["Current approach: manual, slow and hard to repeat", "Key gaps: visibility, ownership, follow-through", "What we hear most often from the people affected"] },
  { title: () => "Our approach", bullets: () => ["Start small: one team, one workflow, four weeks", "Measure: a single number everyone can see", "Scale: what works becomes the default"] },
  { title: () => "How it works", bullets: () => ["Step 1: capture the work in one place", "Step 2: automate the repeatable parts", "Step 3: review results every two weeks"] },
  { title: () => "What you get", bullets: () => ["Speed: less time on busywork", "Clarity: everyone sees the same picture", "Confidence: decisions backed by evidence"] },
  { title: () => "By the numbers", bullets: () => ["3x faster turnaround", "40% less rework", "2 weeks to first results"] },
  { title: () => "Risks and how we handle them", bullets: () => ["Adoption: involve the people doing the work from day one", "Scope creep: a fixed list of must-haves", "Budget: staged spending with clear checkpoints"] },
  { title: () => "Timeline", bullets: () => ["Month 1: pilot with one team", "Month 2: measure, fix, expand", "Month 3: roll out and hand over"] },
  { title: () => "What people say", bullets: () => ["“This saved our team hours every single week.”", "Early pilot participant"] },
  { title: () => "Key takeaways", bullets: () => ["The problem is real and growing", "The plan is small, measurable and reversible", "We can show results within a quarter"] },
  { title: () => "Next steps", bullets: () => ["Agree on the pilot team this week", "Set the success number together", "Check in again in two weeks"] },
];

function pickSections(n: number): number[] {
  // always first and last; fill the middle in order
  if (n <= 1) return [0];
  const middle = Array.from({ length: SECTIONS.length - 2 }, (_, i) => i + 1);
  const chosen = middle.slice(0, Math.max(0, n - 2));
  while (chosen.length < n - 2) chosen.push(middle[chosen.length % middle.length]);
  return [0, ...chosen, SECTIONS.length - 1];
}

function sentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+|\n+/).map((s) => s.replace(/^[-*•\d.)\s]+/, "").trim()).filter(Boolean);
}

function outlineFromText(text: string, n: number, mode: GenSettings["textMode"]): OutlineItem[] {
  // explicit breaks first: '---' lines or markdown headings
  let chunks = text.split(/\n\s*---+\s*\n/).map((c) => c.trim()).filter(Boolean);
  if (chunks.length < 2) chunks = text.split(/\n(?=#{1,3}\s)/).map((c) => c.trim()).filter(Boolean);
  if (chunks.length < 2) chunks = text.split(/\n\s*\n/).map((c) => c.trim()).filter(Boolean);
  if (chunks.length > n) {
    const size = Math.ceil(chunks.length / n);
    const merged: string[] = [];
    for (let i = 0; i < chunks.length; i += size) merged.push(chunks.slice(i, i + size).join("\n"));
    chunks = merged;
  }
  return chunks.map((c) => {
    const lines = c.split("\n").map((l) => l.trim()).filter(Boolean);
    let title = lines[0].replace(/^#{1,3}\s*/, "");
    let rest = lines.slice(1).join(" ");
    if (title.length > 70 || !rest) {
      const ss = sentences(c);
      title = ss[0].split(/[,:;–—]/)[0].slice(0, 70);
      rest = ss.slice(title === ss[0] ? 1 : 0).join(" ");
    }
    let bullets = sentences(rest);
    if (mode === "condense") bullets = bullets.slice(0, 3).map((b) => b.split(/[,;]/)[0]);
    else if (mode === "generate") bullets = bullets.slice(0, 5);
    return { title: title.replace(/[.:]$/, ""), bullets };
  });
}

function amountTrim(items: string[], amount: GenSettings["amount"]): string[] {
  return amount === "brief" ? items.slice(0, 2) : amount === "medium" ? items.slice(0, 4) : items;
}

function cardFromOutline(item: OutlineItem, i: number, total: number, s: GenSettings): Card {
  const id = newId;
  const b = amountTrim(item.bullets, s.amount);
  const blocks: Block[] = [];
  let layout: Layout = s.imageSource === "none" ? "none" : (["accent_left", "none", "accent_right", "none", "accent_top"] as Layout[])[i % 5];
  const numeric = b.filter((x) => /^\d[\d.,]*\s*[x%]?|^\$?\d/.test(x));
  const colonish = b.filter((x) => /^[^:]{2,30}:\s/.test(x));
  const stepish = /how|step|timeline|roadmap|process|plan/i.test(item.title);

  if (i === 0) {
    blocks.push({ id: id(), type: "heading", level: 1, text: item.title });
    if (b[0]) blocks.push({ id: id(), type: "paragraph", text: b.join(". ").replace(/\.\./g, ".") });
    layout = s.imageSource === "none" ? "none" : "accent_right";
  } else if (numeric.length >= 2 && numeric.length === b.length) {
    blocks.push({ id: id(), type: "heading", level: 2, text: item.title });
    blocks.push({
      id: id(), type: "stats",
      items: b.slice(0, 4).map((x) => { const m = x.match(/^(\$?[\d.,]+\s*[x%]?\+?)\s*(.*)$/); return { value: m?.[1]?.trim() ?? x, label: m?.[2] ?? "" }; }),
    });
    layout = "none";
  } else if (colonish.length >= 2 && colonish.length === b.length && b.length <= 4) {
    blocks.push({ id: id(), type: "heading", level: 2, text: item.title });
    blocks.push({ id: id(), type: "columns", columns: b.map((x) => { const [t, ...r] = x.split(":"); return { title: t.trim(), text: r.join(":").trim() }; }) });
    layout = layout === "accent_left" || layout === "accent_right" ? "accent_top" : layout;
  } else if (b.length === 2 && b[0].startsWith("“")) {
    blocks.push({ id: id(), type: "quote", text: b[0].replace(/[“”]/g, ""), cite: b[1] });
  } else if (stepish) {
    blocks.push({ id: id(), type: "heading", level: 2, text: item.title });
    blocks.push({ id: id(), type: "numbered", items: b.map((x) => x.replace(/^(step \d+|month \d+)\s*:\s*/i, (m) => `**${m.replace(/\s*:\s*$/, "")}:** `)) });
  } else {
    blocks.push({ id: id(), type: "heading", level: 2, text: item.title });
    if (b.length) blocks.push({ id: id(), type: "bullets", items: b });
  }
  if (i === total - 1 && total > 2) blocks.push({ id: id(), type: "callout", tone: "tip", text: "Questions? Let's talk them through." });
  if (s.amount === "detailed" && i > 0 && b.length) {
    blocks.push({ id: id(), type: "paragraph", text: `In short: ${b[0].charAt(0).toLowerCase()}${b[0].slice(1)}.` });
  }
  return { id: id(), layout, imageUrl: null, imageAlt: "", imageCredit: "", content: blocks, notes: `Talking points for “${item.title}”: ${b.join("; ")}` };
}

export const localEngine: DeckEngine = {
  name: "offline",
  async *outline(input, source, s) {
    const items =
      source === "paste"
        ? outlineFromText(input, s.numCards, s.textMode)
        : pickSections(s.numCards).map((k) => ({ title: SECTIONS[k].title(cleanTopic(input)), bullets: SECTIONS[k].bullets(cleanTopic(input)) }));
    for (const it of items) { await pace(); yield it; }
  },
  async *cards(outline, s) {
    for (let i = 0; i < outline.length; i++) { await pace(); yield cardFromOutline(outline[i], i, outline.length, s); }
  },
  async edit(cards, instruction) {
    const ins = instruction.toLowerCase();
    return cards.map((c) => {
      let content = c.content;
      if (/short|condens|concise|trim/.test(ins)) {
        content = content.map((b) => (b.type === "bullets" || b.type === "numbered" ? { ...b, items: b.items.slice(0, 3) } : b.type === "paragraph" ? { ...b, text: b.text.split(/(?<=[.!?])\s/)[0] } : b));
      }
      if (/bullet/.test(ins)) {
        content = content.map((b) => (b.type === "paragraph" ? { id: b.id, type: "bullets" as const, items: b.text.split(/(?<=[.!?])\s+/).filter(Boolean) } : b));
      }
      if (/visual|image|picture|layout/.test(ins) && c.layout === "none") return { ...c, layout: "accent_left" as const, content };
      if (/upper|shout|caps/.test(ins)) content = content.map((b) => (b.type === "heading" ? { ...b, text: b.text.toUpperCase() } : b));
      return { ...c, content };
    });
  },
};
