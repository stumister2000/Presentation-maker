"use client";
import { useState } from "react";
import { Presentation, FileText, Plus, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextField, TextArea, Select } from "@/components/ui/field";
import { Segmented } from "@/components/ui/segmented";
import { Chip } from "@/components/ui/chip";
import { Modal, Drawer } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { EmptyState, Skeleton, CreditsMeter } from "@/components/ui/misc";
import { ThemeGrid } from "@/components/deck/theme-picker";
import { CardView } from "@/components/deck/card-view";
import { THEMES, themeStyle } from "@/lib/themes";
import type { Card } from "@/lib/blocks";

const sample: Card = {
  id: "sample-1",
  layout: "accent_right",
  imageUrl: null,
  imageAlt: "",
  notes: "",
  content: [
    { id: "a", type: "heading", level: 1, text: "Ship the **quarterly** plan" },
    { id: "b", type: "paragraph", text: "Three bets, one owner each, reviewed every *two weeks*." },
    { id: "c", type: "bullets", items: ["Cut onboarding to 3 steps", "Launch the team plan", "Halve support backlog"] },
  ],
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="py-8 border-b border-border">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted mb-4">{title}</h2>
      {children}
    </section>
  );
}

export default function DesignPage() {
  const [modal, setModal] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [format, setFormat] = useState<"presentation" | "document">("presentation");
  const [theme, setTheme] = useState("paper");
  const toast = useToast();

  return (
    <main className="mx-auto max-w-[var(--layout-content-max)] px-4 sm:px-8 pb-24">
      <h1 className="text-xl font-bold pt-10">Design system</h1>
      <p className="text-text-muted">Every primitive and state, in one place.</p>

      <Section title="Buttons">
        <div className="flex flex-wrap gap-3 items-center">
          <Button variant="primary">Primary</Button>
          <Button>Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Delete</Button>
          <Button variant="primary" loading>Saving</Button>
          <Button disabled>Disabled</Button>
          <Button variant="primary" size="sm"><Plus size={16} />Small</Button>
          <Button variant="primary" size="lg">Large</Button>
          <Button icon aria-label="Add"><Plus size={18} /></Button>
        </div>
      </Section>

      <Section title="Fields">
        <div className="grid sm:grid-cols-2 gap-4 max-w-3xl">
          <TextField label="Email" type="email" placeholder="you@company.com" />
          <TextField label="Password" type="password" error="Use at least 8 characters." defaultValue="short" />
          <Select label="Cards" options={[8, 10, 12].map((n) => ({ value: String(n), label: `${n} cards` }))} />
          <TextField label="Disabled" disabled defaultValue="Read only" />
          <div className="sm:col-span-2">
            <TextArea label="What do you want to make?" hideLabel prompt placeholder="A pitch for a neighbourhood composting service" />
          </div>
        </div>
      </Section>

      <Section title="Segmented, chips, credits">
        <div className="flex flex-wrap gap-4 items-center">
          <Segmented label="Format" value={format} onChange={setFormat} options={[
            { value: "presentation", label: "Presentation", icon: <Presentation size={15} /> },
            { value: "document", label: "Document", icon: <FileText size={15} /> },
          ]} />
          <Chip>Suggestion chip</Chip>
          <Chip selected>Selected</Chip>
          <CreditsMeter credits={360} />
          <CreditsMeter credits={40} />
          <CreditsMeter credits={0} />
        </div>
      </Section>

      <Section title="Overlays and feedback">
        <div className="flex gap-3">
          <Button onClick={() => setModal(true)}>Open modal</Button>
          <Button onClick={() => setDrawer(true)}>Open drawer</Button>
          <Button onClick={() => toast("Link copied", "success")}>Toast</Button>
          <Button onClick={() => toast("Could not save. Retrying…", "error")}>Error toast</Button>
        </div>
        <Modal open={modal} onClose={() => setModal(false)} title="Share this deck"
          footer={<><Button onClick={() => setModal(false)}>Cancel</Button><Button variant="primary" onClick={() => setModal(false)}>Done</Button></>}>
          <p className="text-sm text-text-muted">Focus is trapped here. Esc closes.</p>
        </Modal>
        <Drawer open={drawer} onClose={() => setDrawer(false)} title="Themes">
          <ThemeGrid value={theme} onChange={setTheme} columns={2} />
        </Drawer>
      </Section>

      <Section title="Empty state and skeleton">
        <div className="grid sm:grid-cols-2 gap-6">
          <EmptyState icon={<Inbox size={32} />} title="Nothing here yet" body="Your presentations will show up here." action={<Button variant="primary">Create new</Button>} />
          <div className="space-y-3"><Skeleton className="h-32" /><Skeleton className="h-4 w-2/3" /><Skeleton className="h-4 w-1/3" /></div>
        </div>
      </Section>

      <Section title="Deck themes">
        <ThemeGrid value={theme} onChange={setTheme} columns={6} />
      </Section>

      <Section title="Card in every theme">
        <div className="grid sm:grid-cols-2 gap-6">
          {THEMES.map((t) => (
            <div key={t.key} className="deck-root rounded-lg p-4 text-[11px] sm:text-[13px]" style={themeStyle(t)}>
              <CardView card={sample} theme={t} fixedRatio />
            </div>
          ))}
        </div>
      </Section>
    </main>
  );
}
