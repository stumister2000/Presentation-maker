import { notFound } from "next/navigation";
import { requireUser } from "@/server/auth";
import { PLAN_LIMITS } from "@/server/queries";
import { CreateFlow } from "@/components/create/create-flow";

export const metadata = { title: "Create" };

export default async function CreateMode({ params }: { params: Promise<{ mode: string }> }) {
  const { mode } = await params;
  if (mode !== "generate" && mode !== "paste" && mode !== "import") notFound();
  const u = await requireUser();
  return <CreateFlow mode={mode} credits={u.credits} maxCards={PLAN_LIMITS[u.plan].maxCards} />;
}
