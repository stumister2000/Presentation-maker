import "server-only";
import { cardTitle, type Card } from "@/lib/blocks";
import type { GenSettings } from "@/lib/generation";
import type { EngineCard } from "./ai/types";

// Stock photos through the official Unsplash API with the owner's own access
// key (UNSPLASH_ACCESS_KEY). Unsplash guidelines: hotlink their image URLs,
// credit the photographer, and ping download_location when a photo is used.

export interface Photo { url: string; thumb: string; alt: string; credit: string; downloadLocation: string }

export const photosEnabled = () => Boolean(process.env.UNSPLASH_ACCESS_KEY);

export async function searchPhotos(query: string, perPage = 12): Promise<Photo[]> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return [];
  const u = new URL("https://api.unsplash.com/search/photos");
  u.searchParams.set("query", query.slice(0, 100));
  u.searchParams.set("per_page", String(perPage));
  u.searchParams.set("orientation", "landscape");
  u.searchParams.set("content_filter", "high");
  const res = await fetch(u, { headers: { Authorization: `Client-ID ${key}`, "Accept-Version": "v1" }, signal: AbortSignal.timeout(8000) });
  if (!res.ok) return [];
  const data = (await res.json()) as { results?: Array<{ urls: { regular: string; small: string }; alt_description: string | null; user: { name: string }; links: { download_location: string } }> };
  return (data.results ?? []).map((r) => ({
    url: r.urls.regular,
    thumb: r.urls.small,
    alt: r.alt_description ?? "",
    credit: `Photo: ${r.user.name} / Unsplash`,
    downloadLocation: r.links.download_location,
  }));
}

/** Tells Unsplash a photo was used, as their API guidelines require. Fire and forget. */
export function trackPhotoUse(downloadLocation: string) {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key || !downloadLocation.startsWith("https://api.unsplash.com/")) return;
  void fetch(downloadLocation, { headers: { Authorization: `Client-ID ${key}` }, signal: AbortSignal.timeout(5000) }).catch(() => {});
}

/** Adds a photo to cards that have an image slot, when photos were requested and a key is configured. */
export async function decorateCard(card: EngineCard, s: GenSettings, topic: string): Promise<Card> {
  const { imageQuery, ...plain } = card;
  if (s.imageSource === "none") return { ...plain, layout: "none", imageUrl: null };
  if (s.imageSource !== "stock" || plain.layout === "none" || plain.imageUrl || !photosEnabled()) return plain;
  try {
    const q = imageQuery || `${cardTitle(plain)} ${topic.split(/\s+/).slice(0, 4).join(" ")}`;
    const [p] = await searchPhotos(q, 1);
    if (!p) return plain;
    trackPhotoUse(p.downloadLocation);
    return { ...plain, imageUrl: p.url, imageAlt: p.alt, imageCredit: p.credit };
  } catch {
    return plain; // artwork is the fallback
  }
}
