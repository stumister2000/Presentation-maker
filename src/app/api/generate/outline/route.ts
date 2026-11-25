import { route, body, ndjson } from "@/server/http";
import { InputSchema, clampSettings } from "@/server/gen-input";
import { getEngine } from "@/server/ai";

export const maxDuration = 60;

export const POST = route(async (req) => {
  const { source, input, settings } = await body(req, InputSchema);
  const s = clampSettings(settings);
  const engine = await getEngine();
  return ndjson(async (send) => {
    let index = 0;
    for await (const item of engine.outline(input, source, s)) {
      if (index >= s.numCards) break;
      send({ type: "outline", item, index: index++ });
    }
    send({ type: "done" });
  });
});
