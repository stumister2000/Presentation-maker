import { requireUser } from "@/server/auth";
import { listDecks } from "@/server/queries";
import { DeckGrid } from "@/components/app/deck-grid";

export const metadata = { title: "Your decks" };

export default async function HomePage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const u = await requireUser();
  const v = (await searchParams).view;
  const view = v === "favorites" || v === "trash" ? v : "all";
  const decks = await listDecks(u.id, view);
  return <DeckGrid key={view} decks={decks} view={view} />;
}
