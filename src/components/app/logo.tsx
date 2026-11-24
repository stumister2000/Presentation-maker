import Link from "next/link";
import { APP_NAME } from "@/lib/brand";

/** Fairdeck mark: a card with its corner folded down, flat and open. Placeholder until the logo brief is delivered. */
export function Mark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h8.8L20 7.7v10.8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 18.5z" fill="var(--color-accent)" />
      <path d="M15.3 3v3.2a1.5 1.5 0 0 0 1.5 1.5H20" fill="none" stroke="var(--color-accent-soft)" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M8 12.5h8M8 16h5" stroke="var(--color-on-accent)" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 font-bold text-lg tracking-tight">
      <Mark />
      {APP_NAME}
    </Link>
  );
}
