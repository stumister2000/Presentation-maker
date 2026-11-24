import "server-only";
import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { HttpError } from "./auth";

/** Wraps a route handler: same-origin check on writes, JSON errors, no stack traces to clients. */
export function route<C>(fn: (req: Request, ctx: C) => Promise<Response | object | null>) {
  return async (req: Request, ctx: C): Promise<Response> => {
    try {
      if (req.method !== "GET" && req.method !== "HEAD") assertSameOrigin(req);
      const out = await fn(req, ctx);
      if (out instanceof Response) return out;
      if (out === null) return new Response(null, { status: 204 });
      return NextResponse.json(out);
    } catch (e) {
      return errorResponse(e);
    }
  };
}

export function errorResponse(e: unknown): Response {
  if (e instanceof HttpError) return NextResponse.json({ error: e.message, code: e.code }, { status: e.status });
  if (e instanceof ZodError) return NextResponse.json({ error: "Some fields are not valid.", issues: e.issues.slice(0, 5) }, { status: 400 });
  console.error(e);
  return NextResponse.json({ error: "That broke on our side, not yours. Try again in a moment." }, { status: 500 });
}

function assertSameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return; // non-browser clients; cookies are SameSite=Lax anyway
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (new URL(origin).host !== host) throw new HttpError(403, "Cross-site request blocked.");
}

export async function body<T>(req: Request, schema: ZodType<T>): Promise<T> {
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > 2_000_000) throw new HttpError(413, "Request too large.");
  let data: unknown;
  try { data = await req.json(); } catch { throw new HttpError(400, "Send a JSON body."); }
  return schema.parse(data);
}

const hits = new Map<string, number[]>();
/** In-memory sliding window. One instance only; swap for Upstash/Redis when scaling out. */
export function rateLimit(key: string, max: number, windowMs: number) {
  max *= Math.max(1, Number(process.env.RATE_LIMIT_MULTIPLIER) || 1); // raised only in tests
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= max) throw new HttpError(429, "Slow down a little and try again in a minute.", "rate_limited");
  arr.push(now);
  hits.set(key, arr);
}

export function ndjson(gen: (send: (o: object) => void) => Promise<void>): Response {
  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(ctrl) {
      const send = (o: object) => ctrl.enqueue(enc.encode(JSON.stringify(o) + "\n"));
      try { await gen(send); } catch (e) {
        const msg = e instanceof HttpError ? e.message : "Generation failed. Your credits were returned.";
        if (!(e instanceof HttpError)) console.error(e);
        send({ type: "error", message: msg, code: e instanceof HttpError ? e.code : undefined });
      } finally { ctrl.close(); }
    },
  });
  return new Response(stream, { headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store", "x-accel-buffering": "no" } });
}
