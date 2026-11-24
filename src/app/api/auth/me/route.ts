import { route } from "@/server/http";
import { requireUser } from "@/server/auth";

export const GET = route(async () => requireUser());
