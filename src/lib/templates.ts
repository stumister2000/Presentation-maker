import { newId, type Block, type Card, type Layout } from "./blocks";

// Original starter structures. Written for this product.

const h = (text: string, level: 1 | 2 | 3 = 2): Block => ({ id: newId(), type: "heading", level, text });
const p = (text: string): Block => ({ id: newId(), type: "paragraph", text });
const ul = (...items: string[]): Block => ({ id: newId(), type: "bullets", items });
const ol = (...items: string[]): Block => ({ id: newId(), type: "numbered", items });
const cols = (...c: Array<[string, string]>): Block => ({ id: newId(), type: "columns", columns: c.map(([title, text]) => ({ title, text })) });
const stats = (...s: Array<[string, string]>): Block => ({ id: newId(), type: "stats", items: s.map(([value, label]) => ({ value, label })) });
const card = (layout: Layout, ...content: Block[]): Card => ({ id: newId(), layout, imageUrl: null, imageAlt: "", content, notes: "" });

export interface Template { key: string; name: string; blurb: string; themeId: string; cards: () => Card[] }

export const TEMPLATES: Template[] = [
  {
    key: "pitch", name: "Startup pitch", blurb: "Ten cards investors expect, in the order they expect them.", themeId: "ink",
    cards: () => [
      card("accent_right", h("Company name", 1), p("One line: who you help and how.")),
      card("none", h("The problem"), ul("Who has it", "How often it hurts", "What they do today")),
      card("accent_left", h("Our solution"), p("What it does, in plain words. Show, do not tell.")),
      card("none", h("Why now"), cols(["Shift", "What changed in the world"], ["Signal", "Proof people want this"], ["Edge", "Why you, why this team"])),
      card("none", h("Traction"), stats(["0", "Paying customers"], ["0%", "Month-on-month growth"], ["0", "Waitlist"])),
      card("accent_top", h("Business model"), ul("Who pays", "How much", "How often")),
      card("none", h("Market"), stats(["$0B", "Total market"], ["$0M", "Reachable in 3 years"])),
      card("none", h("Competition"), cols(["Them", "What they do well"], ["Us", "What we do differently"])),
      card("accent_left", h("Team"), ul("Founder: relevant experience", "Founder: relevant experience")),
      card("none", h("The ask"), p("How much you are raising and what it buys."), ol("Milestone one", "Milestone two", "Milestone three")),
    ],
  },
  {
    key: "weekly", name: "Team update", blurb: "Wins, numbers, blockers and next week. Ten minutes, tops.", themeId: "slate",
    cards: () => [
      card("accent_right", h("Week in review", 1), p("Team name · date")),
      card("none", h("Wins"), ul("Shipped …", "Closed …", "Learned …")),
      card("none", h("Numbers"), stats(["0", "Metric one"], ["0", "Metric two"], ["0", "Metric three"])),
      card("none", h("Blockers"), { id: newId(), type: "callout", tone: "warning", text: "What we need help with, and from whom." }),
      card("none", h("Next week"), ol("Priority one", "Priority two", "Priority three")),
    ],
  },
  {
    key: "lesson", name: "Lesson plan", blurb: "Hook, teach, practise, check. Works for any subject.", themeId: "meadow",
    cards: () => [
      card("accent_right", h("Today we learn…", 1), p("The big question for this lesson.")),
      card("accent_left", h("Warm-up"), p("A quick question or picture to get everyone thinking.")),
      card("none", h("Key ideas"), cols(["Idea one", "Explain simply"], ["Idea two", "Explain simply"], ["Idea three", "Explain simply"])),
      card("none", h("Try it"), ol("Step one", "Step two", "Step three")),
      card("none", h("Check your understanding"), ul("Question one", "Question two")),
      card("accent_top", h("Wrap-up"), p("One sentence each: what did you learn?")),
    ],
  },
  {
    key: "proposal", name: "Project proposal", blurb: "Make the case, show the plan, ask for a yes.", themeId: "paper",
    cards: () => [
      card("accent_right", h("Project name", 1), p("The outcome in one sentence.")),
      card("none", h("Why this, why now"), ul("The opportunity", "The cost of waiting")),
      card("accent_left", h("What we will do"), ul("Scope", "Not in scope")),
      card("none", h("Timeline"), ol("Phase one: dates", "Phase two: dates", "Phase three: dates")),
      card("none", h("Budget and people"), stats(["$0", "Total cost"], ["0", "People"], ["0 wks", "Duration"])),
      card("none", h("Decision needed"), { id: newId(), type: "callout", tone: "tip", text: "What we are asking you to approve today." }),
    ],
  },
];
