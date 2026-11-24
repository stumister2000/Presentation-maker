"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { api } from "@/lib/api";

export function ResetForm() {
  const token = useSearchParams().get("token");
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return (
      <>
        <h1 className="text-xl font-bold mb-1">Reset your password</h1>
        <p className="text-sm text-text-muted mb-6">We will email you a link to choose a new one.</p>
        {sent ? <p role="status" className="text-sm rounded-md bg-accent-soft text-accent p-4">If that address has an account, the link is on its way.</p> : (
          <form className="flex flex-col gap-4" onSubmit={async (e) => {
            e.preventDefault(); setBusy(true); setError(null);
            try { await api("/api/auth/reset-request", { json: { email: String(new FormData(e.currentTarget).get("email")) } }); setSent(true); }
            catch (err) { setError((err as Error).message); } finally { setBusy(false); }
          }}>
            <TextField label="Email" name="email" type="email" autoComplete="email" required />
            {error && <p role="alert" className="text-sm text-danger">{error}</p>}
            <Button type="submit" variant="primary" size="lg" loading={busy}>Send reset link</Button>
          </form>
        )}
        <p className="text-sm text-center mt-4"><Link href="/login" className="text-accent font-semibold">Back to sign in</Link></p>
      </>
    );
  }

  return (
    <>
      <h1 className="text-xl font-bold mb-1">Choose a new password</h1>
      <p className="text-sm text-text-muted mb-6">This signs you out on every other device.</p>
      <form className="flex flex-col gap-4" onSubmit={async (e) => {
        e.preventDefault();
        const password = String(new FormData(e.currentTarget).get("password"));
        if (password.length < 8) { setError("Use at least 8 characters."); return; }
        setBusy(true); setError(null);
        try { await api("/api/auth/reset", { json: { token, password } }); router.replace("/home"); router.refresh(); }
        catch (err) { setError((err as Error).message); setBusy(false); }
      }}>
        <TextField label="New password" name="password" type="password" autoComplete="new-password" hint="At least 8 characters." required />
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        <Button type="submit" variant="primary" size="lg" loading={busy}>Save and sign in</Button>
      </form>
    </>
  );
}
