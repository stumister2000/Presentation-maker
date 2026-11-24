import "server-only";
import { APP_NAME } from "@/lib/brand";

// Transactional email through Resend's REST API with the owner's key
// (RESEND_API_KEY) from the owner's verified domain (EMAIL_FROM).
// Without a key, development prints the email to the server console;
// production refuses to pretend it sent anything.

export interface Mail { to: string; subject: string; text: string; html?: string }

export async function sendEmail(m: Mail): Promise<void> {
  // test hook: EMAIL_OUTBOX=/path/file.jsonl writes mail to a file instead of sending it
  if (process.env.EMAIL_OUTBOX) {
    const { appendFileSync } = await import("node:fs");
    appendFileSync(process.env.EMAIL_OUTBOX, JSON.stringify({ ...m, at: Date.now() }) + "\n");
    return;
  }
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (process.env.NODE_ENV === "production") throw new Error("RESEND_API_KEY is not set");
    console.info(`\n[dev email] to=${m.to}\nsubject: ${m.subject}\n${m.text}\n`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM ?? `${APP_NAME} <hello@example.com>`, to: [m.to], subject: m.subject, text: m.text, html: m.html ?? textToHtml(m.text) }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`email provider returned ${res.status}`);
}

function textToHtml(t: string): string {
  const esc = t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const linked = esc.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1">$1</a>');
  return `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.5;color:#17171c;max-width:520px">${linked.split("\n\n").map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("")}</div>`;
}

export const appUrl = () => (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const emails = {
  verify: (link: string): Omit<Mail, "to"> => ({
    subject: `Confirm your email for ${APP_NAME}`,
    text: `Thanks for signing up.\n\nConfirm your email address with this link:\n${link}\n\nThe link works for 24 hours. If you did not sign up, ignore this email.`,
  }),
  magic: (link: string): Omit<Mail, "to"> => ({
    subject: `Your ${APP_NAME} sign-in link`,
    text: `Here is your sign-in link:\n${link}\n\nIt works once, for the next 15 minutes. If you did not ask for it, ignore this email.`,
  }),
  reset: (link: string): Omit<Mail, "to"> => ({
    subject: `Reset your ${APP_NAME} password`,
    text: `Someone asked to reset the password for this email address.\n\nChoose a new password here:\n${link}\n\nThe link works once, for the next hour. If it was not you, ignore this email and your password stays the same.`,
  }),
  paymentFailed: (link: string): Omit<Mail, "to"> => ({
    subject: `Your ${APP_NAME} payment did not go through`,
    text: `We could not take your latest payment. Your plan stays active for now.\n\nUpdate your card here:\n${link}\n\nIf you meant to cancel, you can do that from the same page.`,
  }),
};
