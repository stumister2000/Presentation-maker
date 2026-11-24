"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { api, ApiError } from "@/lib/api";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const next = useSearchParams().get("next");
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

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {mode === "signup" && <TextField label="Your name" name="name" autoComplete="name" placeholder="Alex Morgan" />}
      <TextField label="Email" name="email" type="email" autoComplete="email" placeholder="you@company.com" error={fieldErr.email} required />
      <TextField label="Password" name="password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"}
        hint={mode === "signup" ? "At least 8 characters." : undefined} error={fieldErr.password} required />
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <Button type="submit" variant="primary" size="lg" loading={busy}>{mode === "signup" ? "Create account" : "Sign in"}</Button>
      <p className="text-sm text-text-muted text-center">
        {mode === "signup" ? <>Already have an account? <Link className="text-accent font-semibold" href="/login">Sign in</Link></>
          : <>New here? <Link className="text-accent font-semibold" href="/signup">Create an account</Link></>}
      </p>
    </form>
  );
}
