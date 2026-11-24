"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export function ConsumeLink() {
  const params = useSearchParams();
  const router = useRouter();
  const kind = params.get("kind") === "verify" ? "verify" : "magic";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <h1 className="text-lg font-bold">{kind === "verify" ? "Confirm your email" : "Sign in"}</h1>
      <p className="text-sm text-text-muted mt-1 mb-6">{kind === "verify" ? "One click and your address is confirmed." : "One click and you are in."}</p>
      {error ? (
        <><p role="alert" className="text-sm text-danger mb-4">{error}</p><Link href="/login" className="text-accent font-semibold">Back to sign in</Link></>
      ) : (
        <Button variant="primary" size="lg" className="w-full" loading={busy} onClick={async () => {
          setBusy(true);
          try { const r = await api<{ next: string }>("/api/auth/consume", { json: { token: params.get("token") ?? "", kind } }); router.replace(r.next); router.refresh(); }
          catch (e) { setError((e as Error).message); setBusy(false); }
        }}>Continue</Button>
      )}
    </>
  );
}
