import { z } from "zod";
import { route, body, rateLimit } from "@/server/http";
import { recordView } from "@/server/queries";

// Cookieless: the page sends a random id it made for this one page view.
// Nothing is stored on the visitor's device, so no consent banner is needed.
const View = z.object({
  slug: z.string().max(40),
  viewId: z.string().regex(/^[A-Za-z0-9-]{8,40}$/),
  cardsSeen: z.number().int().min(0).max(500),
  seconds: z.number().int().min(0).max(21600),
});

export const POST = route(async (req) => {
  const v = await body(req, View);
  rateLimit(`view:${v.viewId}`, 60, 60_000);
  rateLimit(`view-ip:${req.headers.get("x-forwarded-for") ?? "local"}`, 300, 60_000);
  await recordView(v.slug, v.viewId, v.cardsSeen, v.seconds);
  return null;
});
