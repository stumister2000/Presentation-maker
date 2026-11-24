// Shared by the migrate and seed scripts: same drivers as src/server/db.ts.
import { readdirSync, readFileSync, mkdirSync } from "node:fs";
import path from "node:path";

export async function connect() {
  if (process.env.DATABASE_URL) {
    const { default: postgres } = await import("postgres");
    const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false, ssl: process.env.DATABASE_URL.includes("localhost") ? false : "require" });
    return { query: (t, p = []) => sql.unsafe(t, p), exec: (t) => sql.unsafe(t), close: () => sql.end() };
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const dir = process.env.PGLITE_DIR ?? path.join(process.cwd(), ".data", "pglite");
  if (dir !== "memory") mkdirSync(dir, { recursive: true });
  const db = new PGlite(dir === "memory" ? undefined : dir);
  await db.waitReady;
  return { query: async (t, p = []) => (await db.query(t, p)).rows, exec: (t) => db.exec(t), close: () => db.close() };
}

export async function migrate(db) {
  await db.exec("create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())");
  const done = new Set((await db.query("select name from schema_migrations")).map((r) => r.name));
  const applied = [];
  for (const f of readdirSync("db/migrations").filter((x) => x.endsWith(".sql")).sort()) {
    if (done.has(f)) continue;
    const body = readFileSync(path.join("db/migrations", f), "utf8");
    await db.exec(`begin;\n${body}\ninsert into schema_migrations (name) values ('${f}');\ncommit;`);
    applied.push(f);
  }
  return applied;
}
