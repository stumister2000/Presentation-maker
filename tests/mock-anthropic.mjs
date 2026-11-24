// A stand-in for the Messages API streaming endpoint, for tests only.
// The app talks to it through ANTHROPIC_BASE_URL, so the real SDK code path
// runs without network access or cost. GET /last returns the last request.
import { createServer } from "node:http";

const port = Number(process.env.MOCK_ANTHROPIC_PORT ?? 3299);
let last = null;

function sse(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify({ type: event, ...data })}\n\n`);
}

function linesFor(system, user) {
  if (system.includes("You plan presentations")) {
    const n = Number(/Write exactly (\d+) lines/.exec(system)?.[1] ?? 3);
    return Array.from({ length: n }, (_, i) => JSON.stringify({ title: i === 0 ? "Mock title card" : `Mock point ${i}`, bullets: ["first idea", "second idea"] }));
  }
  if (system.includes("You write presentation cards")) {
    const n = Number(/Write exactly (\d+) cards/.exec(system)?.[1] ?? 3);
    const out = Array.from({ length: n }, (_, i) => JSON.stringify({
      layout: i === 0 ? "accent_right" : "none",
      imageQuery: "mock photo",
      notes: `notes ${i + 1}`,
      content: [{ type: "heading", level: i === 0 ? 1 : 2, text: `Mock card ${i + 1}` }, { type: "bullets", items: ["alpha", "beta"] }],
    }));
    out.splice(1, 0, "this line is not json and must be skipped");
    return out;
  }
  if (system.includes("You edit presentation cards")) {
    const cards = user.split("\nCards:\n")[1]?.split("\n").filter(Boolean) ?? [];
    return cards.map((l) => {
      const c = JSON.parse(l);
      c.content = [{ type: "heading", level: 2, text: "Edited by mock" }];
      return JSON.stringify(c);
    });
  }
  return [];
}

createServer((req, res) => {
  if (req.method === "GET" && req.url === "/last") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(last));
    return;
  }
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    const json = JSON.parse(body || "{}");
    last = { url: req.url, headers: req.headers, body: json };
    const system = typeof json.system === "string" ? json.system : "";
    const user = typeof json.messages?.[0]?.content === "string" ? json.messages[0].content : "";
    const text = linesFor(system, user).join("\n") + "\n";
    res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache" });
    sse(res, "message_start", { message: { id: "msg_mock", type: "message", role: "assistant", content: [], model: json.model, stop_reason: null, stop_sequence: null, usage: { input_tokens: 10, output_tokens: 0 } } });
    sse(res, "content_block_start", { index: 0, content_block: { type: "text", text: "" } });
    // split into small chunks so the line buffer is exercised across deltas
    for (let i = 0; i < text.length; i += 37) sse(res, "content_block_delta", { index: 0, delta: { type: "text_delta", text: text.slice(i, i + 37) } });
    sse(res, "content_block_stop", { index: 0 });
    sse(res, "message_delta", { delta: { stop_reason: "end_turn", stop_sequence: null }, usage: { output_tokens: 50 } });
    sse(res, "message_stop", {});
    res.end();
  });
}).listen(port, () => console.log(`mock anthropic on ${port}`));
