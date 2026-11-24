import type { Metadata } from "next";
import Link from "next/link";
import { getPublicDeck } from "@/server/queries";
import { PublicDeck } from "@/components/public/public-deck";
import { cardTitle, cardToText } from "@/lib/blocks";
import { APP_NAME } from "@/lib/brand";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const deck = await getPublicDeck((await params).slug);
  if (!deck) return { title: "Not available", robots: { index: false } };
  return { title: deck.title, description: cardToText(deck.cards[0] ?? { content: [] } as never).slice(0, 160), robots: { index: false } };
}

export default async function PublicPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ embed?: string }> }) {
  const { slug } = await params;
  const deck = await getPublicDeck(slug);
  if (!deck) {
    return (
      <main className="min-h-dvh grid place-items-center px-6 text-center bg-surface">
        <div>
          <h1 className="text-xl font-bold">This deck is not available</h1>
          <p className="text-text-muted mt-2 max-w-sm">The owner may have turned off the link, or it never existed. Ask them for a fresh link.</p>
          <Link href="/" className="inline-block mt-6 text-accent font-semibold">Go to {APP_NAME}</Link>
        </div>
      </main>
    );
  }
  return <PublicDeck slug={slug} title={deck.title} cards={deck.cards} themeId={deck.themeId} textScale={deck.textScale} watermark={deck.ownerPlan === "free"} embed={(await searchParams).embed === "1"} firstTitle={cardTitle(deck.cards[0])} />;
}
