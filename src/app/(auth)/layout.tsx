import { Logo } from "@/components/app/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-dvh grid place-items-center bg-surface px-4 py-10">
      <div className="w-full max-w-[400px]">
        <div className="flex justify-center mb-6"><Logo /></div>
        <div className="rounded-lg bg-bg p-6 sm:p-8 shadow-card border border-border">{children}</div>
      </div>
    </main>
  );
}
