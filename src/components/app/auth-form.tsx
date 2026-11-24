"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { api, ApiError } from "@/lib/api";

export function AuthForm({ mode, google }: { mode: "login" | "signup"; google?: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");
  const linkError = params.get("error");
  const [magicSent, setMagicSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErr, setFieldErr] = useState<{ email?: string; password?: string }>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email") ?? "").trim();
    const password = String(f.get("password") ?? "");
    const errs: typeof fieldErr = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) errs.email = "Enter a valid email address.";
    if (mode === "signup" && password.length < 8) errs.password = "Use at least 8 characters.";
    if (!password) errs.password = "Enter your password.";
    setFieldErr(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/api/auth/${mode}`, { json: { email, password, name: String(f.get("name") ?? "") } });
      router.replace(next && next.startsWith("/") && !next.startsWith("//") ? next : mode === "signup" ? "/create/generate?welcome=1" : "/home");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not reach the server. Check your connection.");
      setBusy(false);
    }
  }

  async function sendMagic(form: HTMLFormElement | null) {
    const email = String(new FormData(form ?? undefined).get("email") ?? "").trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) { setFieldErr({ email: "Enter your email first." }); return; }
    setFieldErr({});
    try { await api("/api/auth/magic", { json: { email } }); setMagicSent(true); }
    catch (err) { setError((err as Error).message); }
  }

  if (magicSent) {
    return <p role="status" className="text-sm rounded-md bg-accent-soft text-accent p-4">Check your inbox. If the email does not arrive in a minute, look in spam.</p>;
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {linkError && <p role="alert" className="text-sm text-danger">{linkError === "google" ? "Google sign-in did not work. Try again or use email." : "That link has expired or was already used."}</p>}
      {google && (
        <>
          <a href="/api/auth/google" className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-border bg-bg font-semibold hover:bg-surface">
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8z"/><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.6H2.1v2.8A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.7 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.1a11 11 0 0 0 0 9.8l3.6-2.8z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.1-3.1A11 11 0 0 0 2.1 7.1l3.6 2.8C6.6 7.3 9.1 5.4 12 5.4z"/></svg>
            Continue with Google
          </a>
          <div className="flex items-center gap-3 text-xs text-text-muted"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
        </>
      )}
      {mode === "signup" && <TextField label="Your name" name="name" autoComplete="name" placeholder="Alex Morgan" />}
      <TextField label="Email" name="email" type="email" autoComplete="email" placeholder="you@company.com" error={fieldErr.email} required />
      <TextField label="Password" name="password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"}
        hint={mode === "signup" ? "At least 8 characters." : undefined} error={fieldErr.password} required />
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <Button type="submit" variant="primary" size="lg" loading={busy}>{mode === "signup" ? "Create account" : "Sign in"}</Button>
      {mode === "login" && (
        <div className="flex justify-between text-sm">
          <button type="button" className="text-accent font-semibold" onClick={(e) => sendMagic(e.currentTarget.form)}>Email me a sign-in link</button>
          <Link href="/reset" className="text-text-muted hover:text-text">Forgot password?</Link>
        </div>
      )}
      <p className="text-sm text-text-muted text-center">
        {mode === "signup" ? <>Already have an account? <Link className="text-accent font-semibold" href="/login">Sign in</Link></>
          : <>New here? <Link className="text-accent font-semibold" href="/signup">Create an account</Link></>}
      </p>
    </form>
  );
}
