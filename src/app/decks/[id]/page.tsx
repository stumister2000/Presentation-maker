import { notFound, redirect } from "next/navigation";
import { currentUser, HttpError } from "@/server/auth";
import { getDeck } from "@/server/queries";
import { Editor } from "@/components/editor/editor";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const u = await currentUser();
  if (!u) return { title: "Deck" };
  try { return { title: (await getDeck(u.id, (await params).id)).title }; } catch { return { title: "Deck" }; }
}

export default async function DeckPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const u = await currentUser();
  if (!u) redirect(`/login?next=/decks/${id}`);
  try {
    const deck = await getDeck(u.id, id);
    if (deck.archivedAt) redirect("/home?view=trash");
    return <Editor deck={deck} />;
  } catch (e) {
    if (e instanceof HttpError && e.status === 404) notFound();
    throw e;
  }
}
