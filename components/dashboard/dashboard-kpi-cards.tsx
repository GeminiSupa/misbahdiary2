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
};

export function DashboardKpiCards({ kpis }: DashboardKpiCardsProps) {
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
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs line-clamp-1 break-words">
              {kpi.label}
            </p>
            <p className="text-lg font-bold text-foreground sm:text-xl md:text-2xl break-words leading-tight">
              {kpi.value}
            </p>
            <p className="text-[10px] text-muted-foreground sm:text-xs line-clamp-2 break-words leading-relaxed">
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
