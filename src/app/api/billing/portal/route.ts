import { route } from "@/server/http";
import { HttpError, requireUser } from "@/server/auth";

export const POST = route(async () => {
  await requireUser();
  throw new HttpError(501, "Payments are not switched on yet.", "not_configured");
});
