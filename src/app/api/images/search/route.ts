import { route } from "@/server/http";
import { HttpError, requireUser } from "@/server/auth";

export const GET = route(async () => {
  await requireUser();
  throw new HttpError(501, "Photo search is not set up yet. Paste an image link below instead.", "not_configured");
});
