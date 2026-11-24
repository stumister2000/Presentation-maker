"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowUp, ArrowDown, Plus, Trash2, Sparkles, Presentation, FileText, Shuffle, FileUp, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextArea, TextField, Select } from "@/components/ui/field";
import { Segmented } from "@/components/ui/segmented";
import { Chip } from "@/components/ui/chip";
import { Modal } from "@/components/ui/modal";
import { Skeleton, CreditsMeter } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { ThemeGrid } from "@/components/deck/theme-picker";
import { ScaledCard } from "@/components/deck/scaled-card";
import { apiStream, ApiError } from "@/lib/api";
import { DEFAULT_SETTINGS, LANGUAGES, MAX_INPUT_CHARS, generationCost, readStream, type GenSettings, type OutlineItem } from "@/lib/generation";
import { sanitizeCard, type Card } from "@/lib/blocks";
import { getTheme } from "@/lib/themes";

type Mode = "generate" | "paste" | "import";
type Step = "input" | "outline" | "generating";

const EXAMPLES = [
  "A kickoff deck for a community garden project",
  "Quarterly sales review for a small coffee roaster",
  "Teach 10-year-olds how volcanoes work",
  "Pitch: an app that splits household chores fairly",
  "Onboarding guide for new support team members",
  "The history of the bicycle in 8 slides",
];

export function CreateFlow({ mode, credits: initialCredits, maxCards }: { mode: Mode; credits: number; maxCards: number }) {
  const router = useRouter();
  const welcome = useSearchParams().get("welcome") === "1";
  const toast = useToast();
  const [step, setStep] = useState<Step>("input");
  const [input, setInput] = useState("");
  const [s, setS] = useState<GenSettings>({ ...DEFAULT_SETTINGS, numCards: Math.min(DEFAULT_SETTINGS.numCards, maxCards) });
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [credits, setCredits] = useState(initialCredits);
  const [noCredits, setNoCredits] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const source = mode === "generate" ? "prompt" : "paste";
  const set = <K extends keyof GenSettings>(k: K, v: GenSettings[K]) => setS((x) => ({ ...x, [k]: v }));
  const cost = generationCost(outline.length || s.numCards);

  useEffect(() => () => abort.current?.abort(), []);

  async function draftOutline() {
    setError(null);
    if (input.trim().length < 3) { setError(mode === "generate" ? "Describe what you want to make." : "Paste some text first."); return; }
    setStep("outline");
    setOutline([]);
    setStreaming(true);
    abort.current = new AbortController();
    try {
      const res = await apiStream("/api/generate/outline", { source, input, settings: s }, abort.current.signal);
      await readStream(res, (e) => {
        if (e.type === "outline") setOutline((o) => [...o, e.item]);
        if (e.type === "error") throw new ApiError(500, e.message);
      });
    } catch (e) {
      if ((e as Error).name !== "AbortError") { setError((e as Error).message); setStep("input"); }
    } finally { setStreaming(false); }
  }

  async function generate(free = false) {
    const clean = outline.map((o) => ({ title: o.title.trim(), bullets: o.bullets.map((b) => b.trim()).filter(Boolean) })).filter((o) => o.title);
    if (!clean.length) { setError("Add at least one card title."); return; }
    if (!free && credits < generationCost(clean.length)) { setNoCredits(true); return; }
    setNoCredits(false);
    setError(null);
    setStep("generating");
    setCards([]);
    let deckId: string | null = null;
    abort.current = new AbortController();
    try {
      const res = await apiStream("/api/generate/deck", { source, input, settings: { ...s, numCards: clean.length }, outline: clean, free }, abort.current.signal);
      let failed: string | null = null;
      await readStream(res, (e) => {
        if (e.type === "deck") deckId = e.id;
        if (e.type === "card") { const c = sanitizeCard(e.card); if (c) setCards((xs) => [...xs, c]); }
        if (e.type === "done" && typeof e.credits === "number") setCredits(e.credits);
        if (e.type === "error") failed = e.message;
      });
      if (failed) throw new ApiError(500, failed);
      if (deckId) router.push(`/decks/${deckId}?new=1`);
    } catch (e) {
      if (e instanceof ApiError && e.code === "out_of_credits") { setNoCredits(true); setStep("outline"); return; }
      if ((e as Error).name === "AbortError") return;
      setError((e as Error).message);
      if (deckId) toast("Some cards were made before the error. They are in your dashboard.", "info");
    }
  }

  const theme = getTheme(s.themeId);

  /* ---------- step: generating ---------- */
  if (step === "generating") {
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="text-xl font-bold flex items-center gap-2"><Sparkles className="text-accent" size={22} aria-hidden="true" />{error ? "That did not finish" : "Designing your deck"}</h1>
        <p className="text-text-muted mt-1 mb-6" aria-live="polite">{error ? error : `${cards.length} of ${outline.length} cards ready`}</p>
        {error && <div className="flex gap-2 mb-6"><Button variant="primary" onClick={() => generate()}><RotateCcw size={16} />Try again</Button><Button onClick={() => setStep("outline")}>Back to outline</Button></div>}
        <ol className="flex flex-col gap-4">
          {outline.map((o, i) => (
            <li key={i} className="aspect-video rounded-lg overflow-hidden border border-border">
              {cards[i] ? <div className="animate-rise h-full"><ScaledCard card={cards[i]} theme={theme} className="h-full w-full" /></div>
                : <div className="h-full p-6 flex flex-col gap-3 bg-surface"><span className="text-sm text-text-muted">{o.title}</span><Skeleton className="h-8 w-2/3" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-4 w-1/3" /></div>}
            </li>
          ))}
        </ol>
      </div>
    );
  }

  /* ---------- step: outline ---------- */
  if (step === "outline") {
    const move = (i: number, d: -1 | 1) => setOutline((o) => { const j = i + d; if (j < 0 || j >= o.length) return o; const c = [...o]; [c[i], c[j]] = [c[j], c[i]]; return c; });
    return (
      <div className="mx-auto max-w-[var(--layout-content-max)]">
        <button onClick={() => { abort.current?.abort(); setStep("input"); }} className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text mb-4"><ArrowLeft size={16} />Back</button>
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <section aria-labelledby="outline-h">
            <h1 id="outline-h" className="text-xl font-bold">Shape the outline</h1>
            <p className="text-text-muted mt-1 mb-5">Edit titles and points, reorder or remove cards. Each item becomes one card.</p>
            <ol className="flex flex-col gap-3" aria-busy={streaming}>
              {outline.map((o, i) => (
                <li key={i} className="animate-rise rounded-lg border border-border bg-bg p-3 sm:p-4 flex gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent-soft text-accent text-sm font-bold">{i + 1}</span>
                  <div className="flex-1 min-w-0 flex flex-col gap-2">
                    <label className="sr-only" htmlFor={`ot-${i}`}>Card {i + 1} title</label>
                    <input id={`ot-${i}`} value={o.title} maxLength={200} onChange={(e) => setOutline((x) => x.map((y, k) => (k === i ? { ...y, title: e.target.value } : y)))}
                      className="w-full bg-transparent text-base font-semibold rounded px-1 -mx-1 focus-visible:outline-2 focus-visible:outline-focus" placeholder="Card title" />
                    <label className="sr-only" htmlFor={`ob-${i}`}>Card {i + 1} points, one per line</label>
                    <textarea id={`ob-${i}`} value={o.bullets.join("\n")} rows={Math.max(1, o.bullets.length)}
                      onChange={(e) => setOutline((x) => x.map((y, k) => (k === i ? { ...y, bullets: e.target.value.split("\n") } : y)))}
                      className="w-full resize-none bg-transparent text-sm text-text-muted rounded px-1 -mx-1 focus-visible:outline-2 focus-visible:outline-focus" placeholder="Points for this card, one per line" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <Button icon size="sm" variant="ghost" aria-label={`Move card ${i + 1} up`} disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp size={15} /></Button>
                    <Button icon size="sm" variant="ghost" aria-label={`Move card ${i + 1} down`} disabled={i === outline.length - 1} onClick={() => move(i, 1)}><ArrowDown size={15} /></Button>
                    <Button icon size="sm" variant="ghost" aria-label={`Remove card ${i + 1}`} onClick={() => setOutline((x) => x.filter((_, k) => k !== i))}><Trash2 size={15} /></Button>
                  </div>
                </li>
              ))}
              {streaming && <li><Skeleton className="h-20" /></li>}
            </ol>
            {!streaming && (
              <div className="mt-3 flex gap-2">
                <Button size="sm" disabled={outline.length >= maxCards} onClick={() => setOutline((o) => [...o, { title: "", bullets: [] }])}><Plus size={15} />Add card</Button>
                <Button size="sm" variant="ghost" onClick={draftOutline}><Shuffle size={15} />Redraft</Button>
              </div>
            )}
            {outline.length >= maxCards && <p className="text-xs text-text-muted mt-2">Your plan allows up to {maxCards} cards per generation.</p>}
          </section>

          <aside className="flex flex-col gap-6 lg:sticky lg:top-20 self-start w-full" aria-label="Settings">
            <div>
              <h2 className="text-sm font-semibold mb-2">Theme</h2>
              <ThemeGrid value={s.themeId} onChange={(k) => set("themeId", k)} columns={3} />
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold">Text per card</h2>
              <Segmented label="Text per card" value={s.amount} onChange={(v) => set("amount", v)} options={[{ value: "brief", label: "Brief" }, { value: "medium", label: "Medium" }, { value: "detailed", label: "Detailed" }]} />
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold">Visuals</h2>
              <Segmented label="Visuals" value={s.imageSource} onChange={(v) => set("imageSource", v)} options={[{ value: "art", label: "Artwork" }, { value: "stock", label: "Photos" }, { value: "none", label: "None" }]} />
            </div>
            <TextField label="Audience" placeholder="e.g. investors, new hires, Year 6" value={s.audience} maxLength={120} onChange={(e) => set("audience", e.target.value)} />
            <TextField label="Tone" placeholder="e.g. confident, playful, plain" value={s.tone} maxLength={80} onChange={(e) => set("tone", e.target.value)} />
            <TextArea label="Design notes (optional)" rows={3} maxLength={500} value={s.designNotes} onChange={(e) => set("designNotes", e.target.value)}
              placeholder="e.g. One idea per card. No bullet points. Say 'members', never 'customers'."
              hint="The AI follows these as written." />
            <div className="rounded-lg bg-surface p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between text-sm"><span>{outline.length} cards</span><span className="flex items-center gap-1.5">Uses {cost} of <CreditsMeter credits={credits} /></span></div>
              {error && <p role="alert" className="text-sm text-danger">{error}</p>}
              <Button variant="primary" size="lg" disabled={streaming || !outline.length} onClick={() => generate()}><Sparkles size={18} />Make my deck</Button>
            </div>
          </aside>
        </div>
        <OutOfCredits open={noCredits} onClose={() => setNoCredits(false)} need={cost} have={credits} onFree={() => generate(true)} />
      </div>
    );
  }

  /* ---------- step: input ---------- */
  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/create" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text mb-6"><ArrowLeft size={16} />All options</Link>
      {welcome && <p className="mb-4 rounded-md bg-accent-soft text-accent px-4 py-3 text-sm font-medium">Welcome! You have {credits} credits. Your first deck takes about a minute.</p>}
      <h1 className="text-xl sm:text-[1.75rem] font-bold text-center">
        {mode === "generate" ? "What are we making?" : mode === "paste" ? "Paste your notes" : "Import a file"}
      </h1>
      <p className="text-text-muted text-center mt-1 mb-6">
        {mode === "generate" ? "One sentence is enough. You will review the outline before anything is designed."
          : mode === "paste" ? "Use --- on its own line to force a new card. Headings become card titles."
          : "Plain text and Markdown files work best. The text opens in paste mode."}
      </p>

      <div className="flex flex-wrap justify-center gap-3 mb-4">
        <Segmented label="Format" value={s.format} onChange={(v) => set("format", v)} options={[
          { value: "presentation", label: "Presentation", icon: <Presentation size={15} aria-hidden="true" /> },
          { value: "document", label: "Document", icon: <FileText size={15} aria-hidden="true" /> },
        ]} />
        <Select label="Number of cards" hideLabel value={String(s.numCards)} onChange={(e) => set("numCards", Number(e.target.value))} className="!w-auto"
          options={Array.from({ length: maxCards }, (_, i) => ({ value: String(i + 1), label: `${i + 1} card${i ? "s" : ""}` }))} />
        <Select label="Language" hideLabel value={s.language} onChange={(e) => set("language", e.target.value)} className="!w-auto" options={LANGUAGES.map((l) => ({ value: l, label: l }))} />
      </div>

      {mode === "import" && !input ? (
        <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border-input p-10 text-center cursor-pointer hover:bg-surface focus-within:outline-2 focus-within:outline-focus">
          <FileUp size={28} className="text-text-muted" aria-hidden="true" />
          <span className="font-semibold">Choose a .txt or .md file</span>
          <span className="text-sm text-text-muted">Up to 200 KB. PowerPoint, Word and PDF import are on the way.</span>
          <input type="file" accept=".txt,.md,.markdown,text/plain,text/markdown" className="sr-only" onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            if (f.size > 200_000) { setError("That file is over 200 KB."); return; }
            setInput((await f.text()).slice(0, MAX_INPUT_CHARS));
          }} />
        </label>
      ) : (
        <TextArea label={mode === "generate" ? "Describe your deck" : "Your text"} hideLabel prompt autoFocus
          rows={mode === "generate" ? 3 : 12} maxLength={mode === "generate" ? 2000 : MAX_INPUT_CHARS}
          value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) draftOutline(); }}
          placeholder={mode === "generate" ? "A pitch for a neighbourhood tool-lending library" : "Paste notes, an outline, an article…"} />
      )}

      {mode !== "generate" && input && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold">Text handling</span>
          <Segmented label="Text handling" value={s.textMode} onChange={(v) => set("textMode", v)} options={[
            { value: "generate", label: "Expand" }, { value: "condense", label: "Condense" }, { value: "preserve", label: "Keep my words" },
          ]} />
          <span className="text-xs text-text-muted ml-auto">{input.length.toLocaleString()} / {MAX_INPUT_CHARS.toLocaleString()}</span>
        </div>
      )}

      {error && <p role="alert" className="text-sm text-danger mt-3">{error}</p>}
      <div className="mt-5 flex justify-center">
        <Button variant="primary" size="lg" onClick={draftOutline} disabled={!input.trim()}><Sparkles size={18} />Draft outline</Button>
      </div>

      {mode === "generate" && (
        <div className="mt-10">
          <h2 className="text-sm font-semibold text-text-muted text-center mb-3">Need a spark?</h2>
          <div className="flex flex-wrap justify-center gap-2">
            {EXAMPLES.map((x) => <Chip key={x} onClick={() => setInput(x)}>{x}</Chip>)}
          </div>
        </div>
      )}
    </div>
  );
}

function OutOfCredits({ open, onClose, need, have, onFree }: { open: boolean; onClose: () => void; need: number; have: number; onFree: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Not enough credits for AI writing" size="sm"
      footer={<><Link href="/settings#plans" className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-semibold hover:bg-surface">See plans</Link><Button variant="primary" onClick={onFree}>Build from my outline, free</Button></>}>
      <p className="text-sm text-text-muted">AI writing for this deck needs {need} credits and you have {have}.</p>
      <p className="text-sm text-text-muted mt-2">You can still make it: we lay out your outline as it is, with your theme, at no cost. Nothing you wrote is lost.</p>
    </Modal>
  );
}
