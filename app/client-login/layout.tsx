import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Client portal login • Lawyer Diary",
};

export default function ClientLoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-10">
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
          `,
            backgroundSize: "50px 50px",
          }}
        />
      </div>
      <div className="relative z-10 w-full max-w-md">
        <div className="relative rounded-2xl bg-slate-800/95 p-6 shadow-2xl backdrop-blur-xl border border-white/10 sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
