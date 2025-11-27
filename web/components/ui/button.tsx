import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        // Primary action – neon/3D style used across the app
        default:
          "relative overflow-hidden rounded-full border border-primary/50 bg-gradient-to-br from-primary via-primary/90 to-[#ec4899] text-primary-foreground shadow-[0_18px_45px_rgba(37,99,235,0.45)] hover:shadow-[0_14px_30px_rgba(37,99,235,0.55)] hover:translate-y-[1px] active:translate-y-[2px] active:shadow-[0_10px_24px_rgba(15,23,42,0.55)]",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        success:
          "bg-success text-success-foreground hover:bg-success/90 focus-visible:ring-success/30 dark:focus-visible:ring-success/40",
        warning:
          "bg-warning text-warning-foreground hover:bg-warning/90 focus-visible:ring-warning/30 dark:focus-visible:ring-warning/40",
        // Subtle glass outline – used for secondary/tertiary actions
        outline:
          "rounded-full border border-border/80 bg-background/70 text-foreground shadow-[0_6px_18px_rgba(15,23,42,0.18)] hover:bg-accent/70 hover:text-accent-foreground",
        // Secondary action – softer glass variant that still feels elevated
        secondary:
          "rounded-full border border-primary/20 bg-primary/5 text-primary shadow-[0_10px_30px_rgba(15,23,42,0.22)] hover:bg-primary/10 hover:border-primary/40",
        // Ghost – text emphasis with light hover glass
        ghost:
          "rounded-full hover:bg-accent/70 hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
