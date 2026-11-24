import tokens from "./theme-tokens.json";

export interface DeckTheme {
  key: string;
  name: string;
  headingFont: string;
  bodyFont: string;
  colors: { page: string; card: string; text: string; muted: string; accent: string };
  dark: boolean;
  /** deck-wide text size multiplier */
  scale?: number;
}

export const TEXT_SCALES = { s: 0.9, m: 1, l: 1.15, xl: 1.3 } as const;
export type TextScale = keyof typeof TEXT_SCALES;
export const withScale = (t: DeckTheme, s: string | null | undefined): DeckTheme => ({ ...t, scale: TEXT_SCALES[(s as TextScale) ?? "m"] ?? 1 });

const FONTS = {
  serif: "'Fraunces Variable', Georgia, serif",
  bookSerif: "'Source Serif 4 Variable', Georgia, serif",
  sans: "'Inter Variable', system-ui, sans-serif",
  grotesk: "'Space Grotesk Variable', 'Inter Variable', system-ui, sans-serif",
};

const meta: Record<string, Omit<DeckTheme, "key" | "colors">> = {
  paper: { name: "Paper", headingFont: FONTS.serif, bodyFont: FONTS.sans, dark: false },
  ink: { name: "Ink", headingFont: FONTS.grotesk, bodyFont: FONTS.sans, dark: true },
  meadow: { name: "Meadow", headingFont: FONTS.bookSerif, bodyFont: FONTS.sans, dark: false },
  ember: { name: "Ember", headingFont: FONTS.serif, bodyFont: FONTS.sans, dark: true },
  slate: { name: "Slate", headingFont: FONTS.sans, bodyFont: FONTS.sans, dark: false },
  mono: { name: "Mono", headingFont: FONTS.grotesk, bodyFont: FONTS.grotesk, dark: true },
};

export const THEMES: DeckTheme[] = Object.entries(tokens as Record<string, DeckTheme["colors"]>).map(([key, colors]) => ({
  key,
  colors,
  ...(meta[key] ?? { name: key, headingFont: FONTS.sans, bodyFont: FONTS.sans, dark: false }),
}));

export const DEFAULT_THEME = "paper";

export function getTheme(key: string | null | undefined): DeckTheme {
  return THEMES.find((t) => t.key === key) ?? THEMES.find((t) => t.key === DEFAULT_THEME)!;
}

export function themeStyle(t: DeckTheme): React.CSSProperties {
  return {
    ["--deck-page" as string]: t.colors.page,
    ["--deck-card" as string]: t.colors.card,
    ["--deck-text" as string]: t.colors.text,
    ["--deck-muted" as string]: t.colors.muted,
    ["--deck-accent" as string]: t.colors.accent,
    ["--deck-heading-font" as string]: t.headingFont,
    ["--deck-body-font" as string]: t.bodyFont,
    ["--deck-scale" as string]: String(t.scale ?? 1),
  };
}

/** Deterministic abstract artwork used when a card has a layout but no photo. */
export function accentArt(seed: string, t: DeckTheme): string {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const r = (n: number) => ((h = (h * 1103515245 + 12345) >>> 0) % n);
  const shapes: string[] = [];
  for (let i = 0; i < 5; i++) {
    const cx = r(400), cy = r(500), rad = 60 + r(160), op = (0.18 + r(40) / 100).toFixed(2);
    const fill = i % 2 ? t.colors.accent : t.colors.muted;
    shapes.push(`<circle cx="${cx}" cy="${cy}" r="${rad}" fill="${fill}" opacity="${op}"/>`);
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice"><rect width="400" height="500" fill="${t.colors.page}"/>${shapes.join("")}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
