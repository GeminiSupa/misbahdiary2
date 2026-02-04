import * as React from "react"

import { cn } from "@/lib/utils"

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        // Mobile-first: Solid background, single shadow, tap feedback
        "bg-card/95 text-card-foreground flex flex-col gap-5 rounded-xl border border-border/60 py-5 shadow-[0_1px_3px_rgba(0,0,0,0.1)] transition-all duration-100 active:scale-[1.02]",
        // Desktop: Backdrop blur, multi-layer shadows, hover effects
        "lg:bg-card/80 lg:backdrop-blur-xl lg:shadow-[0_0_0_1px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.1),0_4px_12px_rgba(0,0,0,0.05)] lg:duration-300 lg:hover:border-primary/30 lg:hover:shadow-[0_0_0_1px_rgba(0,112,242,0.1),0_2px_8px_rgba(0,112,242,0.1),0_8px_24px_rgba(0,112,242,0.08)] lg:hover:-translate-y-0.5 lg:py-6 lg:gap-6",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-4 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-4 sm:px-5 sm:[.border-b]:pb-5 md:px-6 md:[.border-b]:pb-6",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-4 sm:px-5 md:px-6", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        // Mobile: stack actions with comfortable tap targets
        "flex flex-col items-stretch gap-2 px-4 pt-4 [.border-t]:pt-4",
        // Tablet / desktop: horizontal alignment
        "sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-5 sm:[.border-t]:pt-5 md:px-6 md:[.border-t]:pt-6",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
