import { route } from "@/server/http";
import { requireUser } from "@/server/auth";
import { getAnalytics } from "@/server/queries";

export const GET = route(async (_req, { params }: { params: Promise<{ id: string }> }) => {
  const u = await requireUser();
  return getAnalytics(u.id, (await params).id);
});
