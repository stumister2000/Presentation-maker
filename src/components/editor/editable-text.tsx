"use client";
import { useEffect, useRef, useState } from "react";
import { Inline } from "@/components/deck/card-view";
import { cn } from "@/lib/cn";

type Tag = "div" | "h1" | "h2" | "h3" | "p" | "span" | "li";

/**
 * Text you can click into. At rest it shows formatted text (**bold**,
 * *italic*, links); while focused it shows the raw characters so the marks
 * can be edited. Commits on blur. Plain text only, paste included.
 */
export function EditableText({
  value, onCommit, placeholder, className, tag = "div", label, autoFocus, onEnter, onBackspaceEmpty, onSlash, onFocused, multiline,
}: {
  value: string;
  onCommit: (v: string) => void;
  placeholder: string;
  className?: string;
  tag?: Tag;
  label: string;
  autoFocus?: boolean;
  onEnter?: (textBefore: string, textAfter: string) => void;
  onBackspaceEmpty?: () => void;
  onSlash?: (el: HTMLElement) => void;
  onFocused?: () => void;
  multiline?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLElement | null>(null);
  const Comp = tag as React.ElementType;

  useEffect(() => { if (autoFocus) setEditing(true); }, [autoFocus]);

  useEffect(() => {
    const el = ref.current;
    if (!editing || !el) return;
    el.textContent = value;
    el.focus();
    const r = document.createRange();
    r.selectNodeContents(el);
    r.collapse(false);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(r);
    onFocused?.();
    // value intentionally read once when editing starts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  function commit() {
    const t = (ref.current?.innerText ?? "").replace(/ /g, " ").replace(multiline ? /\n{3,}/g : /\n+/g, multiline ? "\n\n" : " ");
    setEditing(false);
    if (t !== value) onCommit(t.trimEnd());
  }

  if (!editing) {
    return (
      <Comp
        key="view"
        tabIndex={0}
        role="textbox"
        aria-label={label}
        aria-multiline={multiline || undefined}
        className={cn("cursor-text rounded-sm hover:bg-[color-mix(in_srgb,var(--deck-text)_4%,transparent)] focus-visible:outline-2 focus-visible:outline-[var(--deck-accent)]", className)}
        onFocus={() => setEditing(true)}
        onClick={(e: React.MouseEvent) => { if ((e.target as HTMLElement).closest("a")) e.preventDefault(); }}
      >
        {value ? <Inline text={value} /> : <span className="deck-muted opacity-70">{placeholder}</span>}
      </Comp>
    );
  }

  return (
    <Comp
      key="edit"
      ref={ref}
      role="textbox"
      aria-label={label}
      aria-multiline={multiline || undefined}
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      data-placeholder={placeholder}
      spellCheck
      className={cn("cursor-text rounded-sm outline-none ring-2 ring-[color-mix(in_srgb,var(--deck-accent)_45%,transparent)] ring-offset-2 ring-offset-[var(--deck-card)] whitespace-pre-wrap", className)}
      onBlur={commit}
      onPaste={(e: React.ClipboardEvent) => {
        e.preventDefault();
        document.execCommand("insertText", false, e.clipboardData.getData("text/plain"));
      }}
      onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
        const el = e.currentTarget;
        if (e.key === "Escape") { e.preventDefault(); el.blur(); return; }
        if (e.key === "Enter" && !e.shiftKey && !(multiline && !onEnter)) {
          e.preventDefault();
          if (!onEnter) { el.blur(); return; }
          const sel = window.getSelection();
          const text = el.innerText;
          let at = text.length;
          if (sel && sel.rangeCount && el.contains(sel.anchorNode)) {
            const r = sel.getRangeAt(0).cloneRange();
            r.selectNodeContents(el);
            r.setEnd(sel.anchorNode!, sel.anchorOffset);
            at = r.toString().length;
          }
          el.textContent = text.slice(0, at);
          commit();
          onEnter(text.slice(0, at), text.slice(at));
          return;
        }
        if (e.key === "Backspace" && !el.innerText.trim() && onBackspaceEmpty) { e.preventDefault(); setEditing(false); onBackspaceEmpty(); return; }
        if (e.key === "/" && !el.innerText.trim() && onSlash) { e.preventDefault(); onSlash(el); return; }
        if ((e.metaKey || e.ctrlKey) && (e.key === "b" || e.key === "i")) {
          e.preventDefault();
          const mark = e.key === "b" ? "**" : "*";
          const sel = window.getSelection()?.toString() ?? "";
          document.execCommand("insertText", false, `${mark}${sel || (e.key === "b" ? "bold" : "italic")}${mark}`);
        }
      }}
    />
  );
}
