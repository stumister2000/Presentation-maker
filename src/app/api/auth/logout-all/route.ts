import { route } from "@/server/http";
import { endAllSessions, endSession, requireUser } from "@/server/auth";

export const POST = route(async () => {
  const u = await requireUser();
  await endAllSessions(u.id);
  await endSession();
  return null;
});
