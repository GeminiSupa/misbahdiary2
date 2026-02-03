import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Mobile-first: 48px height, 16px font, solid background
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground text-foreground dark:bg-input/30 border-input/60 min-h-[48px] h-12 w-full min-w-0 rounded-lg border bg-background/95 px-4 py-3 text-base shadow-sm transition-all duration-100 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        // Desktop: Smaller height, backdrop blur
        "sm:h-10 sm:py-2 sm:text-sm sm:min-h-[40px] sm:bg-background/50 sm:backdrop-blur-sm sm:px-3 sm:duration-200",
        "hover:border-primary/40 hover:bg-background/70 hover:shadow-md hover:text-foreground",
        "focus-visible:border-primary/60 focus-visible:ring-primary/20 focus-visible:ring-2 focus-visible:bg-background focus-visible:text-foreground focus-visible:shadow-[0_0_0_3px_rgba(59,130,246,0.1),0_0_20px_rgba(59,130,246,0.15)]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
