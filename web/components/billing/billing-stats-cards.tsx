"use client";

import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

type Stat = {
  label: string;
  value: string;
  hint: string;
};

type BillingStatsCardsProps = {
  stats: Stat[];
};

export function BillingStatsCards({ stats }: BillingStatsCardsProps) {
  const colorClasses = [
    "sap-kpi-tile-primary",
    "sap-kpi-tile-success",
    "sap-kpi-tile-warning",
    "sap-kpi-tile-info",
  ];

  const handleCardClick = (index: number) => {
    // Determine which tab to show based on stat
    const tabMap: Record<number, string> = {
      0: "outstanding", // Outstanding receivables
      1: "paid", // Collected this cycle
      2: "outstanding", // Invoices overdue (filtered)
      3: "outstanding", // Due within 7 days (filtered)
    };
    const targetTab = tabMap[index] || "outstanding";

    // Scroll to invoice board and set tab
    const invoiceBoard = document.getElementById("invoice-board");
    if (invoiceBoard) {
      invoiceBoard.scrollIntoView({ behavior: "smooth", block: "start" });
      // Trigger tab change via custom event
      window.dispatchEvent(new CustomEvent("setInvoiceTab", { detail: targetTab }));
    }
  };

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat, index) => {
        const colorClass = colorClasses[index % colorClasses.length];
        return (
          <button
            key={stat.label}
            type="button"
            onClick={() => handleCardClick(index)}
            className={cn(colorClass, "cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]")}
          >
            <div className="space-y-1.5 sm:space-y-2">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
                {stat.label}
              </p>
              <p className="text-lg font-bold text-foreground sm:text-xl md:text-2xl">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground sm:text-xs">{stat.hint}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
