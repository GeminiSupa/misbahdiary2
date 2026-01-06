import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AIAssistantChat } from "@/components/ai/ai-assistant-chat";
import { Sparkles } from "lucide-react";

export default async function AIAssistantPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return redirect("/sign-in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("firm_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.firm_id) {
    return redirect("/onboarding");
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* Header */}
      <div className="sap-card-hero">
        <div className="sap-card-body">
          <div className="sap-card-header">
            <div className="space-y-2 min-w-0">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 shadow-lg sm:h-12 sm:w-12 sm:rounded-xl">
                  <Sparkles className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                </div>
                <h1 className="text-2xl font-semibold sm:text-3xl">AI Research Assistant</h1>
              </div>
              <p className="text-xs text-muted-foreground sm:text-sm sm:max-w-2xl">
                Ask questions about your cases, analyze documents, and get AI-powered insights based on your firm&apos;s documents and knowledge base.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Chat Interface */}
      <div className="sap-card">
        <div className="sap-card-body p-0">
          <div className="h-[600px] sm:h-[700px]">
            <AIAssistantChat />
          </div>
        </div>
      </div>
    </div>
  );
}
