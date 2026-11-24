import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-dvh grid place-items-center px-6 text-center bg-surface">
      <div>
        <p className="text-sm font-semibold text-accent">404</p>
        <h1 className="text-xl font-bold mt-1">We could not find that page</h1>
        <p className="text-text-muted mt-2">It may have moved, or the link is mistyped.</p>
        <Link href="/home" className="inline-block mt-6 text-accent font-semibold">Back to your decks</Link>
      </div>
    </main>
  );
}
