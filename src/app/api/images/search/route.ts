import { route, rateLimit } from "@/server/http";
import { HttpError, requireUser } from "@/server/auth";
import { photosEnabled, searchPhotos } from "@/server/images";

export const GET = route(async (req) => {
  const u = await requireUser();
  if (!photosEnabled()) throw new HttpError(501, "Photo search is not set up yet. Paste an image link below instead.", "not_configured");
  rateLimit(`photos:${u.id}`, 30, 60_000);
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (!q) return { results: [] };
  return { results: await searchPhotos(q) };
});
