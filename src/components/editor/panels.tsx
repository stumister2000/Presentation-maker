"use client";
import { useEffect, useState } from "react";
import { Copy, Globe, Lock, FileDown, Presentation as PptIcon, Sparkles, Eye, Clock, Layers } from "lucide-react";
import { Drawer, Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { TextArea, TextField } from "@/components/ui/field";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton, CreditsMeter, EmptyState } from "@/components/ui/misc";
import { ThemeGrid } from "@/components/deck/theme-picker";
import { useToast } from "@/components/ui/toast";
import { api, ApiError } from "@/lib/api";
import { AI_EDIT_COST } from "@/lib/generation";
import { isSafeUrl, type Card } from "@/lib/blocks";

export function ThemeDrawer({ open, onClose, value, onChange }: { open: boolean; onClose: () => void; value: string; onChange: (k: string) => void }) {
  return (
    <Drawer open={open} onClose={onClose} title="Theme">
      <p className="text-sm text-text-muted mb-4">Changes colours and fonts on every card. Your content stays put.</p>
      <ThemeGrid value={value} onChange={onChange} columns={2} />
    </Drawer>
  );
}

const SUGGESTIONS = ["Make it shorter", "Turn paragraphs into bullets", "Add visuals to text-only cards", "Make it more persuasive", "Simplify for a general audience", "Fix spelling and grammar"];

export function AiDrawer({ open, onClose, deckId, cardId, cardLabel, credits, onApplied }: {
  open: boolean; onClose: () => void; deckId: string; cardId: string | null; cardLabel: string | null; credits: number;
  onApplied: (cards: Card[], credits?: number) => void;
}) {
  const [text, setText] = useState("");
  const [scope, setScope] = useState<"card" | "deck">(cardId ? "card" : "deck");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { setScope(cardId ? "card" : "deck"); }, [cardId, open]);

  async function run(instruction: string) {
    if (instruction.trim().length < 2) return;
    setBusy(true); setError(null);
    try {
      const r = await api<{ cards: Card[]; credits?: number }>("/api/ai/edit", { json: { deckId, cardId: scope === "card" ? cardId : null, instruction } });
      onApplied(r.cards, r.credits);
      setText("");
    } catch (e) {
      setError(e instanceof ApiError && e.code === "out_of_credits" ? "You are out of credits. Upgrade in Settings to keep editing with AI." : (e as Error).message);
    } finally { setBusy(false); }
  }

  return (
    <Drawer open={open} onClose={onClose} title="Edit with AI">
      <div className="flex flex-col gap-4">
        <Segmented label="What to change" value={scope} onChange={setScope} options={[
          ...(cardId ? [{ value: "card" as const, label: "This card" }] : []), { value: "deck" as const, label: "Whole deck" },
        ]} />
        {scope === "card" && cardLabel && <p className="text-sm text-text-muted -mt-2 truncate">Card: {cardLabel}</p>}
        <TextArea label="Tell the AI what to change" rows={4} value={text} onChange={(e) => setText(e.target.value)} maxLength={1000}
          placeholder="e.g. Rewrite for a board audience and cut each card to three points"
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void run(text); }} />
        <div className="flex flex-wrap gap-2">{SUGGESTIONS.map((s) => <Chip key={s} disabled={busy} onClick={() => run(s)}>{s}</Chip>)}</div>
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-muted flex items-center gap-1">{AI_EDIT_COST} credits per edit · <CreditsMeter credits={credits} /></span>
          <Button variant="primary" loading={busy} onClick={() => run(text)} disabled={!text.trim()}><Sparkles size={16} />Apply</Button>
        </div>
        <p className="text-xs text-text-muted">Not what you wanted? Press Ctrl/⌘ + Z to undo.</p>
      </div>
    </Drawer>
  );
}

export function ShareModal({ open, onClose, slug, access, onAccess }: { open: boolean; onClose: () => void; slug: string; access: "none" | "view"; onAccess: (a: "none" | "view") => void }) {
  const toast = useToast();
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const url = `${origin}/p/${slug}`;
  const embed = `<iframe src="${url}?embed=1" width="960" height="600" style="border:0" allowfullscreen title="Presentation"></iframe>`;
  const copy = async (t: string, msg: string) => { try { await navigator.clipboard.writeText(t); toast(msg, "success"); } catch { toast("Copy failed. Select the text and copy it yourself.", "error"); } };
  return (
    <Modal open={open} onClose={onClose} title="Share" size="md">
      <div className="flex flex-col gap-5">
        <div className="flex items-start gap-3 rounded-lg border border-border p-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-surface">{access === "view" ? <Globe size={18} /> : <Lock size={18} />}</span>
          <div className="flex-1">
            <div className="font-semibold">{access === "view" ? "Anyone with the link can view" : "Only you"}</div>
            <p className="text-sm text-text-muted">{access === "view" ? "Viewers cannot edit. Views show up in analytics." : "Turn on the link to share a read-only version."}</p>
          </div>
          <Segmented label="Link access" value={access} onChange={onAccess} options={[{ value: "none", label: "Off" }, { value: "view", label: "On" }]} />
        </div>
        {access === "view" && (
          <>
            <div className="flex gap-2 items-end">
              <div className="flex-1"><TextField label="Link" readOnly value={url} onFocus={(e) => e.currentTarget.select()} /></div>
              <Button variant="primary" onClick={() => copy(url, "Link copied")}><Copy size={16} />Copy</Button>
            </div>
            <div className="flex gap-2 items-end">
              <div className="flex-1"><TextField label="Embed on a website" readOnly value={embed} onFocus={(e) => e.currentTarget.select()} /></div>
              <Button onClick={() => copy(embed, "Embed code copied")}><Copy size={16} />Copy</Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

export function ExportModal({ open, onClose, deckId, onPptx }: { open: boolean; onClose: () => void; deckId: string; onPptx: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  return (
    <Modal open={open} onClose={onClose} title="Export" size="sm">
      <div className="flex flex-col gap-3">
        <a href={`/decks/${deckId}/print`} target="_blank" rel="noopener"
          className="flex items-center gap-3 rounded-lg border border-border p-4 hover:bg-surface focus-visible:outline-2 focus-visible:outline-focus">
          <FileDown size={20} aria-hidden="true" /><span><span className="block font-semibold">PDF</span><span className="text-sm text-text-muted">Opens a print view. Choose “Save as PDF”.</span></span>
        </a>
        <button type="button" disabled={busy} onClick={async () => {
          setBusy(true);
          try { await onPptx(); toast("PowerPoint file downloaded", "success"); } catch (e) { toast(`Export failed: ${(e as Error).message}`, "error"); } finally { setBusy(false); }
        }} className="flex items-center gap-3 rounded-lg border border-border p-4 text-left hover:bg-surface disabled:opacity-60">
          <PptIcon size={20} aria-hidden="true" /><span><span className="block font-semibold">{busy ? "Building file…" : "PowerPoint (.pptx)"}</span><span className="text-sm text-text-muted">Editable text, speaker notes included.</span></span>
        </button>
      </div>
    </Modal>
  );
}

export function AnalyticsDrawer({ open, onClose, deckId, shared }: { open: boolean; onClose: () => void; deckId: string; shared: boolean }) {
  const [data, setData] = useState<null | { viewers: number; avgSeconds: number; avgCards: number; lastView: string | null; daily: { day: string; n: number }[] }>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!open) return;
    setData(null); setError(null);
    api<NonNullable<typeof data>>(`/api/decks/${deckId}/analytics`).then(setData, (e) => setError((e as Error).message));
  }, [open, deckId]);
  const max = Math.max(1, ...(data?.daily.map((d) => d.n) ?? [1]));
  return (
    <Drawer open={open} onClose={onClose} title="Analytics">
      {error ? <p role="alert" className="text-danger text-sm">{error}</p> : !data ? (
        <div className="flex flex-col gap-3"><Skeleton className="h-20" /><Skeleton className="h-32" /></div>
      ) : data.viewers === 0 ? (
        <EmptyState icon={<Eye size={30} />} title="No views yet" body={shared ? "Send the link to someone. Their visit shows up here." : "Turn on the share link first, then send it to someone."} />
      ) : (
        <div className="flex flex-col gap-5">
          <dl className="grid grid-cols-3 gap-3">
            {[{ icon: Eye, label: "Viewers", v: data.viewers }, { icon: Clock, label: "Avg time", v: `${Math.round(data.avgSeconds / 60)}m ${data.avgSeconds % 60}s` }, { icon: Layers, label: "Avg cards", v: data.avgCards }].map((s) => (
              <div key={s.label} className="rounded-lg bg-surface p-3"><dt className="text-xs text-text-muted flex items-center gap-1"><s.icon size={13} aria-hidden="true" />{s.label}</dt><dd className="text-lg font-bold mt-1">{s.v}</dd></div>
            ))}
          </dl>
          <div>
            <h3 className="text-sm font-semibold mb-2">Last 14 days</h3>
            <div className="flex items-end gap-1 h-28" role="img" aria-label={`Views per day: ${data.daily.map((d) => `${d.day} ${d.n}`).join(", ")}`}>
              {data.daily.map((d) => <div key={d.day} className="flex-1 rounded-t bg-accent" style={{ height: `${(d.n / max) * 100}%` }} title={`${d.day}: ${d.n}`} />)}
            </div>
          </div>
          {data.lastView && <p className="text-xs text-text-muted">Last viewed {new Date(data.lastView).toLocaleString()}</p>}
        </div>
      )}
    </Drawer>
  );
}

export function ImageModal({ open, onClose, onPick, allowArtwork }: { open: boolean; onClose: () => void; onPick: (url: string | null, alt: string) => void; allowArtwork: boolean }) {
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{ url: string; thumb: string; alt: string; credit: string }[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const valid = url && isSafeUrl(url) && url.startsWith("https://");
  useEffect(() => { if (open) { setUrl(""); setAlt(""); setResults(null); setSearchError(null); } }, [open]);
  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setSearchError(null); setResults(null);
    try { setResults((await api<{ results: typeof results }>(`/api/images/search?q=${encodeURIComponent(q)}`)).results ?? []); }
    catch (err) { setSearchError((err as Error).message); }
  }
  return (
    <Modal open={open} onClose={onClose} title="Choose an image" size="lg">
      <div className="flex flex-col gap-5">
        <form onSubmit={search} className="flex gap-2 items-end">
          <div className="flex-1"><TextField label="Search free photos" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. mountain sunrise" /></div>
          <Button type="submit">Search</Button>
        </form>
        {searchError && <p className="text-sm text-text-muted">{searchError}</p>}
        {results && (results.length === 0 ? <p className="text-sm text-text-muted">No photos for “{q}”.</p> : (
          <ul className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {results.map((r) => (
              <li key={r.url}>
                <button type="button" onClick={() => { onPick(r.url, r.alt); onClose(); }} className="block w-full rounded-md overflow-hidden focus-visible:outline-2 focus-visible:outline-focus">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.thumb} alt={r.alt} className="aspect-[4/3] w-full object-cover" />
                </button>
                <span className="block text-[11px] text-text-muted truncate mt-0.5">{r.credit}</span>
              </li>
            ))}
          </ul>
        ))}
        <div className="border-t border-border pt-4 flex flex-col gap-3">
          <TextField label="Or paste an image link" placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value.trim())}
            error={url && !valid ? "Use a link that starts with https://" : undefined} />
          <TextField label="Describe the image" hint="Read aloud by screen readers." value={alt} onChange={(e) => setAlt(e.target.value)} maxLength={300} />
          <div className="flex flex-wrap gap-2 justify-end">
            {allowArtwork && <Button onClick={() => { onPick(null, ""); onClose(); }}>Use theme artwork</Button>}
            <Button variant="primary" disabled={!valid} onClick={() => { onPick(url, alt); onClose(); }}>Use this image</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
