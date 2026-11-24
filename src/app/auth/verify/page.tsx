import { Suspense } from "react";
import { Logo } from "@/components/app/logo";
import { ConsumeLink } from "@/components/app/consume-link";

export const metadata = { title: "Continue", robots: { index: false } };

export default function VerifyPage() {
  return (
    <main className="min-h-dvh grid place-items-center bg-surface px-4">
      <div className="w-full max-w-[400px] rounded-lg bg-bg p-8 shadow-card border border-border text-center">
        <div className="flex justify-center mb-6"><Logo /></div>
        <Suspense><ConsumeLink /></Suspense>
      </div>
    </main>
  );
}
