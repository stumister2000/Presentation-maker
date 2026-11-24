import { Suspense } from "react";
import { redirect } from "next/navigation";
import { currentUser } from "@/server/auth";
import { AppShell } from "@/components/app/shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/login");
  return <Suspense><AppShell user={user}>{children}</AppShell></Suspense>;
}
