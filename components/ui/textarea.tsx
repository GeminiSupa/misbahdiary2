"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex w-full min-h-[88px] rounded-lg border border-input/60 bg-background/50 backdrop-blur-sm px-3 py-2.5 text-base shadow-sm transition-all duration-200 placeholder:text-muted-foreground text-foreground disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm sm:min-h-[80px] sm:py-2",
          "hover:border-primary/40 hover:bg-background/70 hover:shadow-md hover:text-foreground",
          "focus-visible:outline-none focus-visible:border-primary/60 focus-visible:ring-primary/20 focus-visible:ring-2 focus-visible:bg-background focus-visible:text-foreground focus-visible:shadow-[0_0_0_3px_rgba(59,130,246,0.1),0_0_20px_rgba(59,130,246,0.15)]",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };

