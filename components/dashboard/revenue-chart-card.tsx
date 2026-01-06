"use client";

import { SapAreaChart } from "@/components/charts/area-chart";

export type RevenueChartCardProps = {
  data: Array<{ month: string; total: number; outstanding: number }>;
};

export function RevenueChartCard({ data }: RevenueChartCardProps) {
  return (
    <div className="sap-card">
      <div className="sap-card-body space-y-4">
        <div className="sap-card-header">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Revenue trend</h2>
            <p className="text-sm text-muted-foreground">
              Totals vs. outstanding over the last six months.
            </p>
          </div>
        </div>
        <SapAreaChart data={data} dataKey="total" secondaryKey="outstanding" name="Issued" />
      </div>
    </div>
  );
}
