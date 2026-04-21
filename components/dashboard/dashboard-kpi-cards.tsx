"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type KpiRow = {
  label: string;
  value: string | number;
  hint: string;
  href?: string;
};

type DashboardKpiCardsProps = {
  kpis: KpiRow[];
  tone?: "light" | "dark";
};

export function DashboardKpiCards({ kpis, tone = "light" }: DashboardKpiCardsProps) {
  const router = useRouter();

  const handleCardClick = (kpi: KpiRow) => {
    if (kpi.href) {
      router.push(kpi.href);
    }
  };

  const colorClasses = [
    "sap-kpi-tile-primary",
    "sap-kpi-tile-success",
    "sap-kpi-tile-warning",
    "sap-kpi-tile-info",
    "sap-kpi-tile-primary",
    "sap-kpi-tile-success",
  ];

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
      {kpis.map((kpi, index) => {
        const colorClass = colorClasses[index % colorClasses.length];
        const isClickable = !!kpi.href;
        
        const CardContent = () => (
          <div className="min-w-0 h-full flex flex-col space-y-1.5 sm:space-y-2">
            <p
              className={cn(
                "text-[10px] font-medium uppercase tracking-wide sm:text-xs line-clamp-1 wrap-break-word",
                tone === "dark" ? "text-slate-300/80" : "text-muted-foreground",
              )}
            >
              {kpi.label}
            </p>
            <p
              className={cn(
                "text-lg font-bold sm:text-xl md:text-2xl wrap-break-word leading-tight",
                tone === "dark" ? "text-slate-100" : "text-foreground",
              )}
            >
              {kpi.value}
            </p>
            <p
              className={cn(
                "text-[10px] sm:text-xs line-clamp-2 wrap-break-word leading-relaxed",
                tone === "dark" ? "text-slate-300/70" : "text-muted-foreground",
              )}
            >
              {kpi.hint}
            </p>
          </div>
        );

        if (isClickable) {
          return (
            <Link
              key={kpi.label}
              href={kpi.href!}
              className={cn(
                colorClass,
                "block cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] overflow-hidden min-w-0 h-full"
              )}
              onClick={(e) => {
                // Ensure link works
                e.stopPropagation();
              }}
            >
              <CardContent />
            </Link>
          );
        }

        return (
          <div key={kpi.label} className={cn(colorClass, "overflow-hidden min-w-0 h-full")}>
            <CardContent />
          </div>
        );
      })}
    </div>
  );
}
