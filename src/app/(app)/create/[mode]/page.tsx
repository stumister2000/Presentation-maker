import { notFound } from "next/navigation";
import { MAX_CARDS } from "@/server/queries";
import { CreateFlow } from "@/components/create/create-flow";

export const metadata = { title: "Create" };

export default async function CreateMode({ params }: { params: Promise<{ mode: string }> }) {
  const { mode } = await params;
  if (mode !== "generate" && mode !== "paste" && mode !== "import") notFound();
  return <CreateFlow mode={mode} maxCards={MAX_CARDS} />;
}
