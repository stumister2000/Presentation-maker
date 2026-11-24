import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/app/auth-form";
import { currentUser } from "@/server/auth";
import { googleEnabled } from "@/server/google";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (await currentUser()) redirect("/home");
  return (
    <>
      <h1 className="text-xl font-bold mb-1">Welcome back</h1>
      <p className="text-sm text-text-muted mb-6">Sign in to pick up where you left off.</p>
      <Suspense><AuthForm mode="login" google={googleEnabled()} /></Suspense>
    </>
  );
}
