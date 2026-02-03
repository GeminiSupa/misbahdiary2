"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FloatingActionButtonProps = {
  onClick?: () => void;
  href?: string;
  label?: string;
  icon?: React.ReactNode;
  className?: string;
};

export function FloatingActionButton({
  onClick,
  href,
  label = "New",
  icon = <Plus className="h-6 w-6" />,
  className,
}: FloatingActionButtonProps) {
  const button = (
    <Button
      variant="fab"
      size="icon-lg"
      onClick={onClick}
      className={cn("lg:hidden", className)}
      aria-label={label}
    >
      {icon}
    </Button>
  );

  if (href) {
    return (
      <a href={href} className="lg:hidden">
        {button}
      </a>
    );
  }

  return button;
}
