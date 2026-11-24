// npm run db:seed: a demo account with realistic, invented content.
// Sign in as demo@example.com / demo-password-1. Stop the dev server first when using PGlite.
import { randomBytes, scryptSync, randomUUID } from "node:crypto";
import { connect, migrate } from "./db.mjs";

const db = await connect();
await migrate(db);
const email = "demo@example.com";
const salt = randomBytes(16);
const key = scryptSync("demo-password-1", salt, 32, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
const hash = `scrypt$${salt.toString("base64")}$${key.toString("base64")}`;

const existing = await db.query("select id from users where lower(email) = $1", [email]);
if (existing.length) {
  console.log(`${email} already exists; leaving it alone`);
  await db.close();
  process.exit(0);
}
const [u] = await db.query(
  "insert into users (email, name, password_hash, credits, email_verified_at) values ($1, 'Robin Demo', $2, 400, now()) returning id",
  [email, hash],
);
await db.query("insert into credit_ledger (user_id, delta, reason) values ($1, 400, 'signup')", [u.id]);

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
