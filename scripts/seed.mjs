// npm run db:seed: two example decks with invented content for the local user.
// Stop the dev server first when using PGlite.
import { randomBytes, randomUUID } from "node:crypto";
import { connect, migrate } from "./db.mjs";

const db = await connect();
await migrate(db);
const email = "local@fairdeck.local"; // the built-in local user the app runs as

let [u] = await db.query("select id from users where lower(email) = $1", [email]);
if (!u) [u] = await db.query("insert into users (email, name, credits) values ($1, 'You', 0) returning id", [email]);

const id = () => randomUUID();
const decks = [
  {
    title: "Riverside Tool Library: year one", theme: "meadow", cards: [
      { layout: "accent_right", content: [{ id: id(), type: "heading", level: 1, text: "Riverside Tool Library: year one" }, { id: id(), type: "paragraph", text: "What 140 neighbours borrowed, fixed and built together." }] },
      { layout: "none", content: [{ id: id(), type: "heading", level: 2, text: "By the numbers" }, { id: id(), type: "stats", items: [{ value: "140", label: "members" }, { value: "612", label: "loans" }, { value: "38", label: "volunteer shifts" }] }] },
      { layout: "accent_left", content: [{ id: id(), type: "heading", level: 2, text: "Most borrowed" }, { id: id(), type: "numbered", items: ["Cordless drill", "Ladder (8 ft)", "Pressure washer", "Hedge trimmer"] }] },
      { layout: "none", content: [{ id: id(), type: "heading", level: 2, text: "Next year" }, { id: id(), type: "columns", columns: [{ title: "Repair café", text: "Monthly fix-it sessions with volunteer menders." }, { title: "Kids' kits", text: "Starter tool kits for school projects." }] }, { id: id(), type: "callout", tone: "tip", text: "Join a volunteer shift: one Saturday a month." }] },
    ],
  },
  {
    title: "Q3 support review", theme: "slate", cards: [
      { layout: "none", content: [{ id: id(), type: "heading", level: 1, text: "Q3 support review" }, { id: id(), type: "paragraph", text: "Faster replies, fewer repeat tickets, one big gap." }] },
      { layout: "none", content: [{ id: id(), type: "heading", level: 2, text: "Wins" }, { id: id(), type: "bullets", items: ["First reply down from 9h to **3h**", "Help articles cut password tickets by half", "CSAT steady at 92%"] }] },
      { layout: "none", content: [{ id: id(), type: "heading", level: 2, text: "The gap" }, { id: id(), type: "callout", tone: "warning", text: "Weekend tickets wait 31 hours on average." }] },
    ],
  },
];
for (const d of decks) {
  const [row] = await db.query(
    "insert into decks (user_id, title, slug, theme_id) values ($1, $2, $3, $4) returning id",
    [u.id, d.title, randomBytes(9).toString("base64url"), d.theme],
  );
  let i = 0;
  for (const c of d.cards) {
    await db.query("insert into cards (deck_id, position, layout, content, notes) values ($1, $2, $3, $4, '')", [row.id, i++, c.layout, JSON.stringify(c.content)]);
  }
}
console.log(`seeded ${email} with ${decks.length} decks`);
await db.close();
