import Link from "next/link";
import { Logo } from "@/components/app/logo";
import { APP_TAGLINE } from "@/lib/brand";

// Temporary home. replica-launch replaces this with the real landing page.
export default function Landing() {
  return (
    <main className="min-h-dvh flex flex-col">
      <header className="flex items-center justify-between px-6 h-16"><Logo /><Link href="/login" className="text-sm font-semibold">Sign in</Link></header>
      <section className="flex-1 grid place-items-center px-6 text-center">
        <div>
          <h1 className="text-display font-bold max-w-2xl">{APP_TAGLINE}</h1>
          <Link href="/signup" className="inline-flex mt-8 h-12 items-center rounded-md bg-accent px-6 font-semibold text-on-accent">Start free</Link>
        </div>
      </section>
    </main>
  );
}
