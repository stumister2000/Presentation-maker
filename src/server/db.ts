import "server-only";
import { readdirSync, readFileSync, mkdirSync } from "node:fs";
import path from "node:path";

// One tiny adapter over two drivers with the same SQL:
//   DATABASE_URL set  -> postgres.js against a real Postgres (Neon / Supabase)
//   otherwise         -> PGlite (embedded Postgres) in .data/pglite, or memory when PGLITE_DIR=memory
// Queries use a tagged template: await q`select * from decks where id = ${id}`.

export type Row = Record<string, unknown>;
export type Q = <T extends Row = Row>(strings: TemplateStringsArray, ...values: unknown[]) => Promise<T[]>;

interface Driver {
  query(text: string, params: unknown[]): Promise<Row[]>;
  exec(text: string): Promise<void>;
  transaction<T>(fn: (query: (text: string, params: unknown[]) => Promise<Row[]>) => Promise<T>): Promise<T>;
}

function toText(strings: TemplateStringsArray, values: unknown[]): [string, unknown[]] {
  let text = strings[0];
  for (let i = 1; i < strings.length; i++) text += `$${i}` + strings[i];
  const params = values.map((v) => (v !== null && typeof v === "object" && !(v instanceof Date) ? JSON.stringify(v) : v));
  return [text, params];
}

function makeQ(run: (text: string, params: unknown[]) => Promise<Row[]>): Q {
  return (async (strings: TemplateStringsArray, ...values: unknown[]) => {
    const [text, params] = toText(strings, values);
    return run(text, params);
  }) as Q;
}

async function pgliteDriver(): Promise<Driver> {
  const { PGlite } = await import("@electric-sql/pglite");
  const dir = process.env.PGLITE_DIR ?? path.join(process.cwd(), ".data", "pglite");
  if (dir !== "memory") mkdirSync(dir, { recursive: true });
  const db = dir === "memory" ? new PGlite() : new PGlite(dir);
  await db.waitReady;
  let chain: Promise<unknown> = Promise.resolve();
  // PGlite is single-connection: serialise transactions so they do not interleave.
  const serial = <T,>(fn: () => Promise<T>): Promise<T> => {
    const next = chain.then(fn, fn);
    chain = next.catch(() => undefined);
    return next;
  };
  return {
    query: (text, params) => serial(async () => (await db.query<Row>(text, params)).rows),
    exec: async (text) => { await serial(() => db.exec(text)); },
    transaction: (fn) => serial(() => db.transaction((tx) => fn(async (text, params) => (await tx.query<Row>(text, params)).rows))),
  };
}

async function postgresDriver(url: string): Promise<Driver> {
  const { default: postgres } = await import("postgres");
  const sql = postgres(url, { max: 5, prepare: false, ssl: url.includes("localhost") ? false : "require" });
  return {
    query: async (text, params) => (await sql.unsafe(text, params as never[])) as unknown as Row[],
    exec: async (text) => { await sql.unsafe(text); },
    transaction: (fn) => sql.begin((tx) => fn(async (text, params) => (await tx.unsafe(text, params as never[])) as unknown as Row[])) as never,
  };
}

async function migrate(d: Driver) {
  await d.exec(`create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())`);
  const done = new Set((await d.query(`select name from schema_migrations`, [])).map((r) => r.name as string));
  const dir = path.join(process.cwd(), "db", "migrations");
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".sql")).sort()) {
    if (done.has(f)) continue;
    // A migration file runs as one multi-statement script (simple protocol on both drivers).
    await d.exec(`begin;\n${readFileSync(path.join(dir, f), "utf8")}\ninsert into schema_migrations (name) values ('${f.replace(/'/g, "''")}');\ncommit;`);
  }
}

const g = globalThis as unknown as { __db?: Promise<Driver> };

function driver(): Promise<Driver> {
  g.__db ??= (async () => {
    const d = process.env.DATABASE_URL ? await postgresDriver(process.env.DATABASE_URL) : await pgliteDriver();
    await migrate(d);
    return d;
  })();
  return g.__db;
}

export const q: Q = (async (strings: TemplateStringsArray, ...values: unknown[]) => {
  const d = await driver();
  const [text, params] = toText(strings, values);
  return d.query(text, params);
}) as Q;

/** Run fn in one transaction. Inside, use the q it hands you. */
export async function tx<T>(fn: (q: Q) => Promise<T>): Promise<T> {
  const d = await driver();
  return d.transaction((run) => fn(makeQ(run)));
}
