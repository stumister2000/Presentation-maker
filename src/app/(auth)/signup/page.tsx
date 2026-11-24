import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/app/auth-form";
import { currentUser } from "@/server/auth";
import { googleEnabled } from "@/server/google";

export const metadata = { title: "Create your account" };

export default async function SignupPage() {
  if (await currentUser()) redirect("/home");
  return (
    <>
      <h1 className="text-xl font-bold mb-1">Start with 400 free credits</h1>
      <p className="text-sm text-text-muted mb-6">You see the cost of every deck before you make it. No card needed.</p>
      <Suspense><AuthForm mode="signup" google={googleEnabled()} /></Suspense>
    </>
  );
}
