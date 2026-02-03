import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-5 sm:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive overflow-hidden min-w-0 [&>*:not(svg):not(a)]:truncate [&>a]:truncate [&>a]:block [&>a]:min-w-0",
  {
    variants: {
      variant: {
        // Primary action – Mobile-first with optimized colors
        default:
          "bg-[#1A91FF] sm:bg-gradient-to-r sm:from-primary sm:to-primary/90 text-primary-foreground rounded-lg shadow-sm active:bg-[#0057D2] sm:hover:from-[#0057D2] sm:hover:to-[#0040B0] sm:hover:shadow-[0_4px_12px_rgba(0,112,242,0.3),0_0_20px_rgba(0,112,242,0.2)] active:scale-[0.95] sm:active:scale-[0.98] transition-all duration-100 sm:duration-200 relative overflow-hidden",
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
        // Floating Action Button (FAB) - Mobile primary CTA
        fab: "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-[#1A91FF] sm:bg-gradient-to-r sm:from-primary sm:to-primary/90 text-primary-foreground shadow-lg active:bg-[#0057D2] sm:hover:from-[#0057D2] sm:hover:to-[#0040B0] sm:hover:shadow-xl active:scale-[0.95] sm:active:scale-[0.98] transition-all duration-100 sm:duration-200 lg:hidden",
      },
      size: {
        default: "h-12 px-4 py-3 text-base sm:h-11 sm:px-4 sm:py-2.5 sm:text-sm font-medium has-[>svg]:px-3 min-h-[48px] sm:min-h-[40px] whitespace-nowrap",
        sm: "h-12 gap-1.5 px-3 py-2.5 text-base sm:h-10 sm:px-3 sm:py-2 sm:text-sm font-medium has-[>svg]:px-2.5 min-h-[48px] sm:min-h-[36px] [&>*:not(svg):not(a)]:truncate [&>a]:truncate [&>a]:block [&>a]:min-w-0",
        lg: "h-14 px-5 py-3.5 text-lg sm:h-12 sm:px-5 sm:py-3 sm:text-base font-medium has-[>svg]:px-4 min-h-[56px] sm:min-h-[48px] whitespace-nowrap",
        icon: "size-12 sm:size-10 min-h-[48px] sm:min-h-[40px] min-w-[48px] sm:min-w-[40px] whitespace-nowrap",
        "icon-sm": "size-12 sm:size-9 min-h-[48px] sm:min-h-[36px] min-w-[48px] sm:min-w-[36px] whitespace-nowrap",
        "icon-lg": "size-14 sm:size-11 min-h-[56px] sm:min-h-[44px] min-w-[56px] sm:min-w-[44px] whitespace-nowrap",
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
