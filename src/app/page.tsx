import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, Eye, Lock, Type, PenLine, Sparkles, Palette, Play, Share2, FileDown, ArrowRight } from "lucide-react";
import { Logo } from "@/components/app/logo";
import { currentUser } from "@/server/auth";
import { PLANS, CREDIT_PACK_INFO, DAILY_FREE_FLOOR } from "@/lib/plans";
import { APP_NAME } from "@/lib/brand";
import { generationCost } from "@/lib/generation";

export const metadata = {
  title: { absolute: `${APP_NAME}: presentations in a minute, price shown first` },
  description: "Describe your talk, shape the outline, get a designed deck. You see what it costs before you start, and your work is never locked behind a paywall.",
};

const cta = "inline-flex h-12 items-center justify-center gap-2 rounded-md bg-accent px-6 font-semibold text-on-accent hover:bg-accent-hover";

export default async function Landing() {
  if (await currentUser()) redirect("/home");
  return (
    <div className="min-h-dvh">
      <header className="mx-auto max-w-[var(--layout-content-max)] flex items-center justify-between px-4 sm:px-6 h-16">
        <Logo />
        <nav aria-label="Site" className="flex items-center gap-1 sm:gap-4 text-sm">
          <a href="#pricing" className="px-2 py-1 rounded hover:bg-surface">Pricing</a>
          <a href="#faq" className="px-2 py-1 rounded hover:bg-surface hidden sm:inline">Questions</a>
          <Link href="/login" className="px-2 py-1 rounded hover:bg-surface font-semibold">Sign in</Link>
        </nav>
      </header>

      <main>
        {/* 1. Hero */}
        <section className="mx-auto max-w-[var(--layout-content-max)] px-4 sm:px-6 pt-10 sm:pt-16 pb-12 text-center">
          <h1 className="mx-auto max-w-3xl text-[2.25rem] sm:text-display font-bold tracking-tight leading-tight">
            Presentations in a minute. The price before you start.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-text-muted">
            Describe your talk, shape the outline, and get a designed deck you can edit, present and share.
            You always see what it costs first, and your work is never held behind a paywall.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup" className={cta}>Start with 400 free credits <ArrowRight size={18} aria-hidden="true" /></Link>
            <a href="#how" className="inline-flex h-12 items-center justify-center rounded-md border border-border px-6 font-semibold hover:bg-surface">See how it works</a>
          </div>
          <p className="mt-3 text-sm text-text-muted">No card needed.</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/product-editor.webp" width={1440} height={900} alt={`The ${APP_NAME} editor: a generated deck with a card list on the left and the first card open for editing.`}
            className="mt-12 w-full rounded-xl border border-border shadow-pop" />
        </section>

        {/* 2. The problem */}
        <section aria-labelledby="problem-h" className="bg-surface">
          <div className="mx-auto max-w-[var(--layout-content-max)] px-4 sm:px-6 py-16 grid gap-10 md:grid-cols-[1fr_1.2fr] items-center">
            <div>
              <h2 id="problem-h" className="text-xl sm:text-[1.75rem] font-bold leading-tight">AI decks are fast. The surprises are not.</h2>
            </div>
            <ul className="flex flex-col gap-5">
              <li className="flex gap-3"><Lock className="text-accent shrink-0 mt-1" size={20} aria-hidden="true" />
                <p><strong>Cut off halfway.</strong> You type in your idea, watch most of the deck appear, then learn you are out of credits and have to pay to see the rest.</p></li>
              <li className="flex gap-3"><Type className="text-accent shrink-0 mt-1" size={20} aria-hidden="true" />
                <p><strong>Fixing it afterwards.</strong> Text that is too small, an export where you reset fonts line by line, and slides that look like everyone else’s template.</p></li>
            </ul>
          </div>
        </section>

        {/* 3. How it works */}
        <section id="how" aria-labelledby="how-h" className="mx-auto max-w-[var(--layout-content-max)] px-4 sm:px-6 py-16 scroll-mt-16">
          <h2 id="how-h" className="text-xl sm:text-[1.75rem] font-bold text-center">How it works</h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {[
              { n: 1, t: "Say what you need", d: "One sentence, or paste your notes. Pick how many cards and the language." },
              { n: 2, t: "Shape the outline", d: "Edit, reorder or cut each card before anything is designed. Add design notes the AI follows." },
              { n: 3, t: "Get your deck", d: "Cards appear one by one in your theme. Edit anything, then present, share a link or export." },
            ].map((s) => (
              <li key={s.n} className="rounded-lg border border-border p-6">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-accent-soft text-accent font-bold">{s.n}</span>
                <h3 className="mt-4 font-semibold text-lg">{s.t}</h3>
                <p className="mt-1 text-text-muted">{s.d}</p>
              </li>
            ))}
          </ol>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/product-outline.webp" width={1440} height={900} loading="lazy" alt="The outline step: numbered cards to edit on the left, theme, text amount, visuals and design notes on the right, and the exact credit cost above the button."
            className="mt-12 w-full rounded-xl border border-border shadow-card" />
        </section>

        {/* 4. Features, fixes first */}
        <section aria-labelledby="features-h" className="bg-surface">
          <div className="mx-auto max-w-[var(--layout-content-max)] px-4 sm:px-6 py-16">
            <h2 id="features-h" className="text-xl sm:text-[1.75rem] font-bold text-center">Made so nothing catches you out</h2>
            <ul className="mt-10 grid gap-6 sm:grid-cols-2">
              {[
                { i: Eye, t: "The cost, before you click", d: `Every deck shows its price next to the button. Eight cards cost ${generationCost(8)} credits, and that is what you pay.` },
                { i: Lock, t: "Never locked out of your own work", d: "Out of credits? We lay out your outline in your theme for free. Nothing you wrote is held back." },
                { i: Type, t: "Text size for the whole deck", d: "One switch makes every card bigger or smaller, in the editor, when presenting and in the PowerPoint file." },
                { i: PenLine, t: "Design notes it actually follows", d: "“One idea per card.” “Say members, not customers.” Write it once on the outline step." },
              ].map((f) => (
                <li key={f.t} className="rounded-lg bg-bg border border-border p-6 flex gap-4">
                  <f.i className="text-accent shrink-0" size={24} aria-hidden="true" />
                  <div><h3 className="font-semibold">{f.t}</h3><p className="mt-1 text-text-muted">{f.d}</p></div>
                </li>
              ))}
            </ul>
            <h3 className="mt-12 text-center font-semibold">And everything you expect</h3>
            <ul className="mt-5 flex flex-wrap justify-center gap-3 text-sm">
              {[
                { i: Sparkles, t: "AI rewrite of a card or the whole deck" }, { i: Palette, t: "Six themes, switch any time" },
                { i: Play, t: "Present mode with speaker notes" }, { i: Share2, t: "Share links with view analytics" },
                { i: FileDown, t: "PDF and PowerPoint export" },
              ].map((x) => (
                <li key={x.t} className="inline-flex items-center gap-2 rounded-pill border border-border bg-bg px-4 py-2"><x.i size={16} className="text-accent" aria-hidden="true" />{x.t}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* 5. Pricing */}
        <section id="pricing" aria-labelledby="pricing-h" className="mx-auto max-w-[var(--layout-content-max)] px-4 sm:px-6 py-16 scroll-mt-16">
          <h2 id="pricing-h" className="text-xl sm:text-[1.75rem] font-bold text-center">Pricing</h2>
          <p className="text-center text-text-muted mt-2">Yearly plans get two months free. Cancel in one click from Settings.</p>
          <ul className="mt-10 grid gap-5 md:grid-cols-3">
            {PLANS.map((p) => (
              <li key={p.key} className="rounded-lg border border-border p-6 flex flex-col gap-3">
                <h3 className="font-semibold text-lg">{p.name}</h3>
                <p className="text-sm text-text-muted -mt-2">{p.forWho}</p>
                <p><span className="text-xl font-bold">${p.monthly}</span><span className="text-text-muted"> / month</span>
                  {p.yearly > 0 && <span className="block text-sm text-text-muted">or ${p.yearly} / year</span>}</p>
                <p className="text-sm font-medium">{p.credits}</p>
                <ul className="flex flex-col gap-1.5 text-sm text-text-muted flex-1">
                  {p.features.map((f) => <li key={f} className="flex gap-2"><Check size={15} className="text-success shrink-0 mt-0.5" aria-hidden="true" />{f}</li>)}
                </ul>
                <Link href="/signup" className={p.key === "plus" ? cta : "inline-flex h-12 items-center justify-center rounded-md border border-border px-6 font-semibold hover:bg-surface"}>
                  {p.key === "free" ? "Start free" : `Start free, upgrade to ${p.name} later`}
                </Link>
              </li>
            ))}
          </ul>
          <p className="text-center text-sm text-text-muted mt-6">Need a few more? {CREDIT_PACK_INFO.credits} credits for ${CREDIT_PACK_INFO.price}, on any plan, never expire.</p>
        </section>

        {/* 6. FAQ */}
        <section id="faq" aria-labelledby="faq-h" className="bg-surface scroll-mt-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
            <h2 id="faq-h" className="text-xl sm:text-[1.75rem] font-bold text-center">Questions</h2>
            <div className="mt-8 flex flex-col gap-3">
              {[
                { q: "What is a credit?", a: `AI writing uses credits: ${generationCost(1) - 3} per deck plus 3 per card, and 5 per AI rewrite. A deck you build from your own outline, or from a template, costs nothing.` },
                { q: "What happens when I run out?", a: `You keep everything. You can build the deck from your outline for free, wait for the daily top-up to ${DAILY_FREE_FLOOR} credits on the free plan, buy a ${CREDIT_PACK_INFO.credits}-credit pack, or upgrade.` },
                { q: "Can I bring in slides from other presentation tools?", a: "Not yet. Today you can paste text or import a .txt or Markdown file, and export to PowerPoint or PDF. PowerPoint import is on the roadmap." },
                { q: "Will my decks work in PowerPoint?", a: "Export gives you a .pptx with editable text and your speaker notes. Fonts fall back to ones installed on your computer, so check spacing before a big meeting." },
                { q: "How do I cancel?", a: "Settings, Manage billing, Cancel. One click, no call, no survey. You keep your plan until the end of the period you paid for." },
                { q: "Who sees my decks?", a: "Only you, until you turn on a share link. Viewers cannot edit. Turn the link off and it stops working straight away." },
              ].map((f) => (
                <details key={f.q} className="group rounded-lg bg-bg border border-border p-5">
                  <summary className="cursor-pointer font-semibold list-none flex justify-between gap-4">{f.q}<span aria-hidden="true" className="text-text-muted group-open:rotate-45 transition-transform">+</span></summary>
                  <p className="mt-3 text-text-muted">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* 7. Final CTA */}
        <section className="mx-auto max-w-[var(--layout-content-max)] px-4 sm:px-6 py-20 text-center">
          <h2 className="text-xl sm:text-[1.75rem] font-bold">Your next deck, without the small print</h2>
          <p className="mt-2 text-text-muted">400 free credits. No card. Cancel paid plans in one click.</p>
          <Link href="/signup" className={`${cta} mt-8`}>Make my first deck <ArrowRight size={18} aria-hidden="true" /></Link>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-[var(--layout-content-max)] px-4 sm:px-6 py-8 flex flex-wrap gap-4 justify-between text-sm text-text-muted">
          <span>© {new Date().getFullYear()} {APP_NAME}</span>
          <nav aria-label="Legal" className="flex gap-4">
            <Link href="/privacy" className="hover:text-text">Privacy</Link>
            <Link href="/terms" className="hover:text-text">Terms</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
