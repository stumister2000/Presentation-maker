import { test } from "node:test";
import assert from "node:assert/strict";
import { sanitizeCard, isSafeUrl, stripMarks, cardTitle } from "../../src/lib/blocks.ts";
import { readStream } from "../../src/lib/generation.ts";

test("sanitizeCard drops invalid blocks and keeps valid ones", () => {
  const c = sanitizeCard({
    layout: "accent_left",
    content: [
      { type: "heading", level: 1, text: "Hello" },
      { type: "script", text: "<script>alert(1)</script>" },
      { type: "bullets", items: "not an array" },
      { type: "paragraph", text: "World" },
    ],
  });
  assert.ok(c);
  assert.equal(c.content.length, 2);
  assert.deepEqual(c.content.map((b) => b.type), ["heading", "paragraph"]);
  assert.equal(c.layout, "accent_left");
});

test("sanitizeCard rejects unsafe image URLs and unknown layouts", () => {
  const c = sanitizeCard({ layout: "sideways", imageUrl: "javascript:alert(1)", content: [] });
  assert.ok(c);
  assert.equal(c.imageUrl, null);
  assert.equal(c.layout, "none");
});

test("isSafeUrl allows https and relative paths only", () => {
  assert.equal(isSafeUrl("https://example.com/a.png"), true);
  assert.equal(isSafeUrl("/local.png"), true);
  assert.equal(isSafeUrl("javascript:alert(1)"), false);
  assert.equal(isSafeUrl("//evil.example/x"), false);
  assert.equal(isSafeUrl("data:text/html,hi"), false);
});

test("stripMarks and cardTitle", () => {
  assert.equal(stripMarks("**Bold** and *it* and [link](https://x.y)"), "Bold and it and link");
  const c = sanitizeCard({ content: [{ type: "paragraph", text: "Body" }, { type: "heading", level: 2, text: "**Title**" }] })!;
  assert.equal(cardTitle(c), "Title");
});

test("readStream handles lines split across chunks", async () => {
  const chunks = ['{"type":"outline","ind', 'ex":0,"item":{"title":"A","bullets":[]}}\n{"type":"do', 'ne"}\n'];
  const body = new ReadableStream({ start(c) { for (const x of chunks) c.enqueue(new TextEncoder().encode(x)); c.close(); } });
  const seen: string[] = [];
  await readStream(new Response(body), (e) => seen.push(e.type));
  assert.deepEqual(seen, ["outline", "done"]);
});
