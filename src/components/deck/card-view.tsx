import { Fragment } from "react";
import { Info, Lightbulb, TriangleAlert } from "lucide-react";
import type { Block, Card } from "@/lib/blocks";
import { isSafeUrl } from "@/lib/blocks";
import { accentArt, type DeckTheme } from "@/lib/themes";
import { cn } from "@/lib/cn";

/** Renders **bold**, *italic* and [label](https://url). Everything else is text. */
export function Inline({ text }: { text: string }) {
  const out: React.ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\*(.+?)\*|\[(.+?)\]\((.+?)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1]) out.push(<strong key={k++}>{m[1]}</strong>);
    else if (m[2]) out.push(<em key={k++}>{m[2]}</em>);
    else if (m[3] && m[4] && isSafeUrl(m[4])) out.push(<a key={k++} href={m[4]} target="_blank" rel="noopener noreferrer nofollow">{m[3]}</a>);
    else out.push(m[0]);
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out.map((n, i) => <Fragment key={i}>{n}</Fragment>)}</>;
}

const calloutIcon = { info: Info, tip: Lightbulb, warning: TriangleAlert };

export function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case "heading": {
      const cls = block.level === 1 ? "text-[2.6em] leading-[1.08] font-semibold" : block.level === 2 ? "text-[1.7em] leading-tight font-semibold" : "text-[1.25em] font-semibold";
      const Tag = (`h${block.level}`) as "h1" | "h2" | "h3";
      return <Tag className={cls}><Inline text={block.text} /></Tag>;
    }
    case "paragraph":
      return <p className="text-[1.05em] leading-relaxed"><Inline text={block.text} /></p>;
    case "bullets":
      return <ul className="list-disc pl-[1.3em] space-y-[0.4em] text-[1.05em] marker:text-[var(--deck-accent)]">{block.items.map((i, n) => <li key={n}><Inline text={i} /></li>)}</ul>;
    case "numbered":
      return <ol className="list-decimal pl-[1.4em] space-y-[0.4em] text-[1.05em] marker:font-semibold marker:text-[var(--deck-accent)]">{block.items.map((i, n) => <li key={n}><Inline text={i} /></li>)}</ol>;
    case "quote":
      return (
        <blockquote className="border-l-4 border-[var(--deck-accent)] pl-[1em] text-[1.3em] leading-snug italic">
          <Inline text={block.text} />
          {block.cite && <footer className="deck-muted mt-2 text-[0.7em] not-italic">— {block.cite}</footer>}
        </blockquote>
      );
    case "callout": {
      const Icon = calloutIcon[block.tone];
      return (
        <div className="flex gap-3 rounded-[var(--radius-md)] p-[1em] bg-[color-mix(in_srgb,var(--deck-accent)_12%,transparent)]">
          <Icon className="deck-accent shrink-0 mt-[0.15em]" size={20} aria-hidden="true" />
          <p className="leading-relaxed"><Inline text={block.text} /></p>
        </div>
      );
    }
    case "image":
      return (
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={block.url} alt={block.alt} className="w-full rounded-[var(--radius-md)] object-cover max-h-[22em]" loading="lazy" />
          {block.credit && <figcaption className="deck-muted mt-1 text-[0.75em]">{block.credit}</figcaption>}
        </figure>
      );
    case "columns":
      return (
        <div className="grid gap-[1.2em]" style={{ gridTemplateColumns: `repeat(${block.columns.length}, minmax(0, 1fr))` }}>
          {block.columns.map((c, i) => (
            <div key={i} className="rounded-[var(--radius-md)] p-[1em] bg-[color-mix(in_srgb,var(--deck-text)_5%,transparent)]">
              <h3 className="text-[1.15em] font-semibold mb-[0.3em]"><Inline text={c.title} /></h3>
              <p className="deck-muted leading-relaxed text-[0.95em]"><Inline text={c.text} /></p>
            </div>
          ))}
        </div>
      );
    case "stats":
      return (
        <div className="grid gap-[1.2em]" style={{ gridTemplateColumns: `repeat(${block.items.length}, minmax(0, 1fr))` }}>
          {block.items.map((s, i) => (
            <div key={i}>
              <div className="deck-accent text-[2.4em] font-semibold leading-none" style={{ fontFamily: "var(--deck-heading-font)" }}>{s.value}</div>
              <div className="deck-muted mt-[0.4em] text-[0.95em]">{s.label}</div>
            </div>
          ))}
        </div>
      );
    case "divider":
      return <hr className="border-0 h-px bg-[color-mix(in_srgb,var(--deck-text)_15%,transparent)]" />;
    case "button":
      return isSafeUrl(block.href) ? (
        <a href={block.href} target="_blank" rel="noopener noreferrer nofollow"
          className="!no-underline inline-flex rounded-[var(--radius-md)] px-[1.2em] py-[0.6em] font-semibold bg-[var(--deck-accent)] !text-[var(--deck-card)]">
          {block.label}
        </a>
      ) : <span className="deck-muted">{block.label}</span>;
  }
}

/** The card frame: layout + image. `children` is the content column. */
export function CardFrame({
  card, theme, children, className, fixedRatio,
}: { card: Card; theme: DeckTheme; children: React.ReactNode; className?: string; fixedRatio?: boolean }) {
  const img = card.imageUrl ?? (card.layout !== "none" ? accentArt(card.id, theme) : null);
  const media = img && (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={img} alt={card.imageUrl ? card.imageAlt : ""} className="h-full w-full object-cover" />
  );
  const pad = "p-[6%] sm:p-[5.5%]";
  const content = <div className={cn("flex flex-col gap-[1.1em] justify-center min-w-0", pad)}>{children}</div>;
  const base = cn("deck-card relative overflow-hidden w-full", fixedRatio ? "aspect-video" : "min-h-[min(56.25vw,540px)]", className);

  switch (card.layout) {
    case "accent_left":
    case "accent_right":
      return (
        <div className={cn(base, "grid grid-cols-1 sm:grid-cols-[2fr_3fr]", card.layout === "accent_right" && "sm:grid-cols-[3fr_2fr]")}>
          <div className={cn("min-h-40 sm:min-h-0", card.layout === "accent_right" && "sm:order-2")}>{media}</div>
          {content}
        </div>
      );
    case "accent_top":
      return (
        <div className={cn(base, "flex flex-col")}>
          <div className="h-[30%] min-h-32 max-h-64">{media}</div>
          {content}
        </div>
      );
    case "background":
      return (
        <div className={cn(base, "grid")}>
          <div className="absolute inset-0">{media}</div>
          <div className="absolute inset-0 bg-[color-mix(in_srgb,var(--deck-card)_78%,transparent)]" />
          <div className="relative grid">{content}</div>
        </div>
      );
    default:
      return <div className={cn(base, "grid")}>{content}</div>;
  }
}

export function CardView({ card, theme, fixedRatio, className }: { card: Card; theme: DeckTheme; fixedRatio?: boolean; className?: string }) {
  return (
    <CardFrame card={card} theme={theme} fixedRatio={fixedRatio} className={className}>
      {card.content.map((b) => <BlockView key={b.id} block={b} />)}
    </CardFrame>
  );
}
