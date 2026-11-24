import { route } from "@/server/http";
import { endSession } from "@/server/auth";

export const POST = route(async () => { await endSession(); return null; });
