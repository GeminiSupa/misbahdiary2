"use client";

import { type ReactNode } from "react";
import type { Session } from "@supabase/auth-helpers-react";
import { SupabaseProvider } from "@/components/providers/supabase-provider";

type ProvidersProps = {
  children: ReactNode;
  initialSession?: Session | null;
};

export function AppProviders({ children, initialSession = null }: ProvidersProps) {
  return <SupabaseProvider initialSession={initialSession}>{children}</SupabaseProvider>;
}

