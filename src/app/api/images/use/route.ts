import { z } from "zod";
import { route, body } from "@/server/http";
import { requireUser } from "@/server/auth";
import { trackPhotoUse } from "@/server/images";

/** The editor calls this when someone picks a stock photo (Unsplash download tracking). */
export const POST = route(async (req) => {
  await requireUser();
  const { downloadLocation } = await body(req, z.object({ downloadLocation: z.string().url().max(500) }));
  trackPhotoUse(downloadLocation);
  return null;
});
