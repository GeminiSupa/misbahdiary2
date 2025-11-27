"use client";

import { type ReactNode, useState } from "react";
import {
  SessionContextProvider,
  useSessionContext,
  type Session,
} from "@supabase/auth-helpers-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { getBrowserClient } from "@/lib/supabase/client";

type SupabaseProviderProps = {
  children: ReactNode;
  initialSession?: Session | null;
};

export function SupabaseProvider({
  children,
  initialSession = null,
}: SupabaseProviderProps) {
  const [supabaseClient] = useState<SupabaseClient<Database>>(() => getBrowserClient());

  return (
    <SessionContextProvider supabaseClient={supabaseClient} initialSession={initialSession}>
      {children}
    </SessionContextProvider>
  );
}

export function useSupabase() {
  const context = useSessionContext<Database>();
  return {
    ...context,
    supabase: context.supabaseClient,
  };
}

