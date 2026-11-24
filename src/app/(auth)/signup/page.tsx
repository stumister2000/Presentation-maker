import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/app/auth-form";
import { currentUser } from "@/server/auth";

export const metadata = { title: "Create your account" };

export default async function SignupPage() {
  if (await currentUser()) redirect("/home");
  return (
    <>
      <h1 className="text-xl font-bold mb-1">Make your first deck free</h1>
      <p className="text-sm text-text-muted mb-6">You start with 400 AI credits. No card needed.</p>
      <Suspense><AuthForm mode="signup" /></Suspense>
    </>
  );
}
