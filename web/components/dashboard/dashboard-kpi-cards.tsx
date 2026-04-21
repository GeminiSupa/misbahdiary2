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
          <>
            <p
              className={cn(
                "text-[10px] font-medium uppercase tracking-wide sm:text-xs",
                tone === "dark" ? "text-slate-300/80" : "text-muted-foreground",
              )}
            >
              {kpi.label}
            </p>
            <p
              className={cn(
                "mt-1.5 text-lg font-semibold sm:text-xl md:text-2xl",
                tone === "dark" ? "text-slate-100" : "text-foreground",
              )}
            >
              {kpi.value}
            </p>
            <p
              className={cn(
                "mt-0.5 text-[10px] sm:text-xs",
                tone === "dark" ? "text-slate-300/70" : "text-muted-foreground",
              )}
            >
              {kpi.hint}
            </p>
          </>
        );

        if (isClickable) {
          return (
            <Link
              key={kpi.label}
              href={kpi.href!}
              className={cn(
                colorClass,
                "cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md active:scale-[0.98]"
              )}
            >
              <CardContent />
            </Link>
          );
        }

        return (
          <div key={kpi.label} className={colorClass}>
            <CardContent />
          </div>
        );
      })}
    </div>
  );
}
