"use client";
import type { Block, Card } from "./blocks";
import { stripMarks } from "./blocks";
import { accentArt, type DeckTheme } from "./themes";

// Browser-side PowerPoint export with pptxgenjs. Text stays editable in
// PowerPoint; artwork and photos become images. Fonts fall back to the
// nearest installed font on the viewer's machine.

const hex = (c: string) => c.replace("#", "").toUpperCase();

async function svgToPng(dataUrl: string, w = 800, h = 1000): Promise<string> {
  const img = new Image();
  img.src = dataUrl;
  await img.decode();
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/png");
}

async function urlToDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(String(fr.result)); fr.readAsDataURL(blob); });
  } catch { return null; }
}

export async function exportPptx(title: string, cards: Card[], theme: DeckTheme): Promise<void> {
  const { default: PptxGenJS } = await import("pptxgenjs");
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE"; // 13.33 x 7.5 in
  pptx.title = title;
  const W = 13.333, H = 7.5;
  const font = theme.bodyFont.includes("Grotesk") ? "Arial" : "Calibri";
  const headFont = theme.headingFont.includes("Fraunces") || theme.headingFont.includes("Serif") ? "Georgia" : font;
  const c = theme.colors;
  const k = theme.scale ?? 1; // deck-wide text size
  const fs = (n: number) => Math.round(n * k);

  for (const card of cards) {
    const slide = pptx.addSlide();
    slide.background = { color: hex(c.card) };
    if (card.notes) slide.addNotes(card.notes);

    let x = 0.7, y = 0.6, w = W - 1.4;
    const hasMedia = card.layout !== "none";
    let media: string | null = null;
    if (hasMedia) media = card.imageUrl ? await urlToDataUrl(card.imageUrl) : await svgToPng(accentArt(card.id, theme));
    if (media) {
      if (card.layout === "accent_left") { slide.addImage({ data: media, x: 0, y: 0, w: W * 0.4, h: H, sizing: { type: "cover", w: W * 0.4, h: H } }); x = W * 0.4 + 0.6; w = W * 0.6 - 1.2; }
      else if (card.layout === "accent_right") { slide.addImage({ data: media, x: W * 0.6, y: 0, w: W * 0.4, h: H, sizing: { type: "cover", w: W * 0.4, h: H } }); w = W * 0.6 - 1.2; }
      else if (card.layout === "accent_top") { slide.addImage({ data: media, x: 0, y: 0, w: W, h: 2.2, sizing: { type: "cover", w: W, h: 2.2 } }); y = 2.6; }
      else if (card.layout === "background") { slide.addImage({ data: media, x: 0, y: 0, w: W, h: H, sizing: { type: "cover", w: W, h: H }, transparency: 70 }); }
    }

    const maxY = H - 0.5;
    const put = (b: Block) => {
      if (y > maxY) return;
      const base = { x, w, fontFace: font, color: hex(c.text), valign: "top" as const, margin: 0 };
      switch (b.type) {
        case "heading": {
          const size = fs(b.level === 1 ? 40 : b.level === 2 ? 30 : 22);
          const h = b.level === 1 ? 1.5 : 0.9;
          slide.addText(stripMarks(b.text), { ...base, y, h, fontSize: size, bold: true, fontFace: headFont, fit: "shrink" });
          y += h + 0.15; break;
        }
        case "paragraph": case "callout": {
          const h = Math.min(2, 0.35 + b.text.length / 220);
          slide.addText(stripMarks(b.text), { ...base, y, h, fontSize: fs(16), fit: "shrink" });
          y += h + 0.1; break;
        }
        case "quote": {
          const h = 1.2;
          slide.addText([{ text: `“${stripMarks(b.text)}”`, options: { italic: true, fontSize: fs(22), breakLine: true } }, ...(b.cite ? [{ text: `— ${b.cite}`, options: { fontSize: fs(14), color: hex(c.muted) } }] : [])], { ...base, y, h });
          y += h + 0.1; break;
        }
        case "bullets": case "numbered": {
          const h = Math.min(maxY - y, 0.42 * b.items.length + 0.1);
          slide.addText(b.items.map((t) => ({ text: stripMarks(t), options: { bullet: b.type === "numbered" ? { type: "number" as const } : true, breakLine: true } })), { ...base, y, h, fontSize: fs(17), paraSpaceAfter: 6, fit: "shrink" });
          y += h + 0.1; break;
        }
        case "columns": case "stats": {
          const items = b.type === "columns" ? b.columns.map((col) => [col.title, col.text]) : b.items.map((s) => [s.value, s.label]);
          const cw = (w - 0.3 * (items.length - 1)) / items.length;
          items.forEach(([a, t], k) => {
            slide.addText([
              { text: stripMarks(a), options: { bold: true, fontSize: fs(b.type === "stats" ? 32 : 18), color: hex(b.type === "stats" ? c.accent : c.text), breakLine: true } },
              { text: stripMarks(t), options: { fontSize: fs(14), color: hex(c.muted) } },
            ], { ...base, x: x + k * (cw + 0.3), w: cw, y, h: 1.8, fit: "shrink" });
          });
          y += 2; break;
        }
        case "image": break;
        case "divider": slide.addShape("line", { x, y: y + 0.05, w, h: 0, line: { color: hex(c.muted), width: 0.75 } }); y += 0.2; break;
        case "button": slide.addText(b.label, { ...base, y, w: 2.6, h: 0.55, fontSize: fs(15), bold: true, color: hex(c.card), fill: { color: hex(c.accent) }, align: "center", valign: "middle", hyperlink: b.href.startsWith("https://") ? { url: b.href } : undefined }); y += 0.7; break;
      }
    };
    card.content.forEach(put);
  }
  await pptx.writeFile({ fileName: `${title.replace(/[^\w\- ]+/g, "").trim() || "deck"}.pptx` });
}
