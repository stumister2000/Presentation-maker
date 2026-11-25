import { route } from "@/server/http";
import { currentUser } from "@/server/auth";

export const GET = route(async () => currentUser());
