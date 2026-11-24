"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { Segmented } from "@/components/ui/segmented";
import { Modal } from "@/components/ui/modal";
import { CreditsMeter } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { PLANS, CREDIT_PACK_INFO } from "@/lib/plans";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import type { SessionUser } from "@/server/auth";

export function SettingsView({ user }: { user: SessionUser }) {
  const toast = useToast();
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [period, setPeriod] = useState<"monthly" | "yearly">("yearly");
  const [busy, setBusy] = useState<string | null>(null);
  const [del, setDel] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  async function checkout(plan: string) {
    setBusy(plan);
    try { const r = await api<{ url: string }>("/api/billing/checkout", { json: { plan, period } }); window.location.href = r.url; }
    catch (e) { toast((e as Error).message, "error"); setBusy(null); }
  }

  return (
    <div className="mx-auto max-w-4xl flex flex-col gap-10">
      <section aria-labelledby="profile-h">
        <h1 id="profile-h" className="text-xl font-bold mb-4">Settings</h1>
        <form className="flex flex-col sm:flex-row gap-3 sm:items-end max-w-xl" onSubmit={async (e) => {
          e.preventDefault();
          try { await api("/api/account", { method: "PATCH", json: { name } }); toast("Saved", "success"); router.refresh(); } catch (err) { toast((err as Error).message, "error"); }
        }}>
          <div className="flex-1"><TextField label="Name" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} /></div>
          <div className="flex-1"><TextField label="Email" value={user.email} readOnly disabled /></div>
          <Button type="submit">Save</Button>
        </form>
      </section>

      <section id="plans" aria-labelledby="plans-h" className="scroll-mt-24">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <h2 id="plans-h" className="text-lg font-semibold mr-auto">Plan and credits</h2>
          <CreditsMeter credits={user.credits} />
          <Segmented label="Billing period" value={period} onChange={setPeriod} options={[{ value: "monthly", label: "Monthly" }, { value: "yearly", label: "Yearly, 2 months free" }]} />
        </div>
        <ul className="grid gap-4 md:grid-cols-3">
          {PLANS.map((p) => {
            const current = p.key === user.plan;
            const price = period === "yearly" ? p.yearly : p.monthly;
            return (
              <li key={p.key} className={cn("rounded-lg border p-5 flex flex-col gap-3 bg-bg", current ? "border-accent ring-1 ring-accent" : "border-border")}>
                <div className="flex items-center justify-between"><h3 className="font-semibold">{p.name}</h3>{current && <span className="text-xs rounded-pill bg-accent-soft text-accent px-2 py-0.5 font-semibold">Current</span>}</div>
                <div><span className="text-xl font-bold">${price}</span><span className="text-sm text-text-muted"> / {period === "yearly" ? "year" : "month"}</span></div>
                <p className="text-xs text-text-muted -mt-2">{p.forWho}</p>
                <p className="text-sm font-medium">{p.credits}</p>
                <ul className="text-sm text-text-muted flex flex-col gap-1.5 flex-1">
                  {p.features.map((f) => <li key={f} className="flex gap-2"><Check size={15} className="text-success shrink-0 mt-0.5" aria-hidden="true" />{f}</li>)}
                </ul>
                {p.key !== "free" && !current && <Button variant="primary" loading={busy === p.key} onClick={() => checkout(p.key)}>Upgrade to {p.name}</Button>}
                {current && p.key !== "free" && <Button onClick={async () => { try { const r = await api<{ url: string }>("/api/billing/portal", { method: "POST" }); window.location.href = r.url; } catch (e) { toast((e as Error).message, "error"); } }}>Manage billing</Button>}
              </li>
            );
          })}
        </ul>
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-border p-4">
          <div className="flex-1 min-w-48">
            <div className="font-semibold">Need a few more credits?</div>
            <p className="text-sm text-text-muted">{CREDIT_PACK_INFO.credits} credits for ${CREDIT_PACK_INFO.price}, on any plan. They never expire.</p>
          </div>
          <Button loading={busy === "credits"} onClick={() => checkout("credits")}>Buy {CREDIT_PACK_INFO.credits} credits</Button>
        </div>
      </section>

      <section aria-labelledby="sessions-h" className="rounded-lg border border-border p-5">
        <h2 id="sessions-h" className="font-semibold">Signed-in devices</h2>
        <p className="text-sm text-text-muted mt-1 mb-3">Lost a laptop or used a shared computer? Sign out of every device at once.</p>
        <Button onClick={async () => { await api("/api/auth/logout-all", { method: "POST" }); router.replace("/login"); router.refresh(); }}>Sign out everywhere</Button>
      </section>

      <section aria-labelledby="danger-h" className="rounded-lg border border-border p-5">
        <h2 id="danger-h" className="font-semibold">Delete account</h2>
        <p className="text-sm text-text-muted mt-1 mb-3">Removes your account, every deck and all analytics. This cannot be undone.</p>
        <Button variant="danger" onClick={() => setDel(true)}>Delete my account</Button>
      </section>

      <Modal open={del} onClose={() => setDel(false)} title="Delete your account?" size="sm"
        footer={<><Button onClick={() => setDel(false)}>Cancel</Button><Button variant="danger" disabled={confirmText !== "DELETE"} onClick={async () => {
          try { await api("/api/account", { method: "DELETE", json: { confirm: "DELETE" } }); router.replace("/"); router.refresh(); } catch (e) { toast((e as Error).message, "error"); }
        }}>Delete forever</Button></>}>
        <TextField label="Type DELETE to confirm" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoComplete="off" />
      </Modal>
    </div>
  );
}
