import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Sign In • Lawyer Diary",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Professional Lawyer Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        {/* Grid pattern */}
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
        {/* Scale of justice pattern */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-full w-full" style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
                              radial-gradient(circle at 80% 50%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
                              radial-gradient(circle at 50% 20%, rgba(236, 72, 153, 0.1) 0%, transparent 50%)`
          }} />
        </div>
      </div>

      {/* Neon glow effects */}
      <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-purple-500/20 blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-4 py-8 sm:px-6 sm:py-12">
        {/* Logo and Tagline */}
        <div className="mb-8 flex flex-col items-center justify-center space-y-3 sm:mb-12">
          <div className="relative">
            {/* Logo Container with glow */}
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-xl" />
              <div className="relative rounded-2xl bg-gradient-to-br from-slate-800/90 to-slate-900/90 p-6 shadow-2xl backdrop-blur-sm border border-white/10">
                <div className="flex items-center gap-3">
                  {/* UX4U Logo - Stylized */}
                  <div className="relative">
                    <div className="text-4xl font-black tracking-tight">
                      <span className="text-white">U</span>
                      <span className="relative inline-block">
                        <span className="absolute inset-0 bg-gradient-to-r from-orange-500 to-orange-400 blur-sm opacity-75" />
                        <span className="relative text-orange-500">X</span>
                      </span>
                      <span className="text-white">4</span>
                      <span className="text-white">U</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Tagline */}
          <div className="text-center">
            <p className="text-lg font-semibold text-white/90 sm:text-xl">
              Its 4 You
            </p>
            <p className="mt-1 text-sm text-white/60 sm:text-base">
              Professional Legal Practice Management
            </p>
          </div>
        </div>

        {/* Sign In Card */}
        <div className="relative">
          {/* Card glow effect */}
          <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur opacity-75" />
          <div className="relative rounded-2xl bg-slate-800/95 backdrop-blur-xl p-6 shadow-2xl border border-white/10 sm:p-8">
            {children}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-white/40 sm:text-sm">
            Secure • Professional • Trusted
          </p>
        </div>
      </div>
    </div>
  );
}


