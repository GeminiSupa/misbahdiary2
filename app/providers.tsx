"use client";

import { type ReactNode } from "react";
import { SupabaseProvider } from "@/components/providers/supabase-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/toaster";

type ProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: ProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SupabaseProvider>
        {children}
        <Toaster />
      </SupabaseProvider>
    </ThemeProvider>
  );
}

