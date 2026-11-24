import Link from "next/link";
import { APP_NAME } from "@/lib/brand";

/** Placeholder mark: three stacked cards. replica-brand replaces it. */
export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 font-bold text-lg tracking-tight">
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="6" y="3" width="15" height="11" rx="2.5" fill="var(--color-accent)" opacity=".35" />
        <rect x="4.5" y="6" width="15" height="11" rx="2.5" fill="var(--color-accent)" opacity=".6" />
        <rect x="3" y="9" width="15" height="11" rx="2.5" fill="var(--color-accent)" />
      </svg>
      {APP_NAME}
    </Link>
  );
}
