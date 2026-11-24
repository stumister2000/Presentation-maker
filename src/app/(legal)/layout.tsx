import { Logo } from "@/components/app/logo";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="mx-auto max-w-3xl px-4 sm:px-6 h-16 flex items-center"><Logo /></header>
      <main className="mx-auto max-w-3xl px-4 sm:px-6 pb-20 [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-8 [&_p]:mt-3 [&_p]:text-text-muted [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:text-text-muted [&_li]:mt-1">
        <p className="rounded-md bg-accent-soft text-accent px-4 py-3 text-sm !mt-0">Draft for legal review before launch. Replace the bracketed details.</p>
        {children}
      </main>
    </div>
  );
}
