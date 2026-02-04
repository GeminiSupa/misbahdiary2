"use client";

import { useState, type ComponentProps } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSupabase } from "@/components/providers/supabase-provider";
import { cn } from "@/lib/utils";

type SignOutButtonProps = {
  variant?: ComponentProps<typeof Button>["variant"];
  size?: ComponentProps<typeof Button>["size"];
  className?: string;
  /** In sidebar: label only visible when sidebar is expanded (group-hover). Use with parent that has class "group". */
  collapseLabelInSidebar?: boolean;
};

export function SignOutButton({
  variant = "secondary",
  size = "default",
  className,
  collapseLabelInSidebar = false,
}: SignOutButtonProps) {
  const router = useRouter();
  const { supabase } = useSupabase();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    if (!supabase) {
      router.replace("/sign-in");
      router.refresh();
      return;
    }
    setIsLoading(true);
    await supabase.auth.signOut();
    setIsLoading(false);
    router.replace("/sign-in");
    router.refresh();
  };

  const isIconOnly = size === "icon" || size === "icon-sm";
  const labelClasses = cn(
    "truncate",
    collapseLabelInSidebar &&
      "hidden md:inline opacity-0 md:group-hover:opacity-100 transition-opacity duration-200"
  );

  return (
    <Button
      variant={variant}
      size={size}
      className={cn("min-h-[44px] sm:min-h-[40px] min-w-0", className)}
      onClick={handleSignOut}
      disabled={isLoading}
      aria-label="Sign out"
      title="Sign out"
    >
      {isLoading ? (
        <Loader2 className={cn("animate-spin shrink-0", isIconOnly ? "h-4 w-4" : "mr-2 h-4 w-4")} />
      ) : (
        <LogOut className={cn("shrink-0", isIconOnly ? "h-4 w-4" : "mr-2 h-4 w-4")} />
      )}
      {!isIconOnly && <span className={labelClasses}>Sign out</span>}
    </Button>
  );
}
