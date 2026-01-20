import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        // Primary action – SAP Fiori Horizon style
        default:
          "bg-primary text-primary-foreground rounded-lg shadow-sm hover:bg-[#0057D2] hover:shadow-md active:bg-[#0040B0] transition-all",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        success:
          "bg-success text-success-foreground hover:bg-success/90 focus-visible:ring-success/30 dark:focus-visible:ring-success/40",
        warning:
          "bg-warning text-warning-foreground hover:bg-warning/90 focus-visible:ring-warning/30 dark:focus-visible:ring-warning/40",
        // Subtle outline – SAP Fiori Horizon style
        outline:
          "border border-border bg-background text-foreground rounded-lg shadow-sm hover:bg-muted hover:border-primary/30 transition-all",
        // Secondary action – SAP Fiori Horizon style
        secondary:
          "bg-secondary text-secondary-foreground rounded-lg shadow-sm hover:bg-[#D1E9F4] transition-all",
        // Ghost – SAP Fiori Horizon style
        ghost:
          "rounded-lg hover:bg-muted hover:text-foreground transition-all",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-4 py-2.5 text-base sm:text-sm font-medium has-[>svg]:px-3 min-h-[44px] sm:min-h-[40px]",
        sm: "h-10 gap-1.5 px-3 py-2 text-base sm:text-sm font-medium has-[>svg]:px-2.5 min-h-[44px] sm:min-h-[36px]",
        lg: "h-12 px-5 py-3 text-base sm:text-base font-medium has-[>svg]:px-4 min-h-[48px] sm:min-h-[44px]",
        icon: "size-11 sm:size-10 min-h-[44px] sm:min-h-[40px] min-w-[44px] sm:min-w-[40px]",
        "icon-sm": "size-10 sm:size-9 min-h-[44px] sm:min-h-[36px] min-w-[44px] sm:min-w-[36px]",
        "icon-lg": "size-12 sm:size-11 min-h-[48px] sm:min-h-[44px] min-w-[48px] sm:min-w-[44px]",
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
