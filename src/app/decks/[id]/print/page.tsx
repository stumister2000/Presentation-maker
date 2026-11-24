import { notFound, redirect } from "next/navigation";
import { currentUser } from "@/server/auth";
import { getDeck } from "@/server/queries";
import { PrintDeck } from "@/components/public/print-deck";

export const metadata = { title: "Print" };

export default async function PrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const u = await currentUser();
  if (!u) redirect(`/login?next=/decks/${id}/print`);
  const deck = await getDeck(u.id, id).catch(() => null);
  if (!deck) notFound();
  return <PrintDeck title={deck.title} cards={deck.cards} themeId={deck.themeId} textScale={deck.textScale} />;
}
