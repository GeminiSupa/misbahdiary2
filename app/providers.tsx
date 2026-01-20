"use client";

import { type ReactNode } from "react";
import { SupabaseProvider } from "@/components/providers/supabase-provider";
import { Toaster } from "@/components/ui/toaster";

type ProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: ProvidersProps) {
  return (
    <SupabaseProvider>
      {children}
      <Toaster />
    </SupabaseProvider>
  );
}

