import Link from "next/link";
import { Sparkles, ClipboardPaste, FileUp, LayoutTemplate } from "lucide-react";

export const metadata = { title: "Create" };

const OPTIONS = [
  { href: "/create/generate", icon: Sparkles, title: "Generate", body: "Start from one sentence. We draft the outline, you shape it.", tag: "Most popular" },
  { href: "/create/paste", icon: ClipboardPaste, title: "Paste in text", body: "Turn notes, an article or a doc into a designed deck." },
  { href: "/create/import", icon: FileUp, title: "Import a file", body: "Bring in a .txt or .md file and restyle it." },
  { href: "/templates", icon: LayoutTemplate, title: "Start from a template", body: "Pick a ready-made structure and fill it in." },
];

export default function CreatePicker() {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-xl sm:text-xl font-bold text-center">How do you want to start?</h1>
      <p className="text-text-muted text-center mt-1 mb-8">Every option ends in an editable deck.</p>
      <ul className="grid gap-4 sm:grid-cols-2">
        {OPTIONS.map((o) => (
          <li key={o.href}>
            <Link href={o.href} className="group flex h-full gap-4 rounded-lg border border-border bg-bg p-5 hover:border-accent hover:shadow-pop transition-shadow">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-accent-soft text-accent"><o.icon size={22} aria-hidden="true" /></span>
              <span>
                <span className="flex items-center gap-2 font-semibold">{o.title}{o.tag && <span className="rounded-pill bg-accent-soft px-2 py-0.5 text-xs text-accent">{o.tag}</span>}</span>
                <span className="block text-sm text-text-muted mt-1">{o.body}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
