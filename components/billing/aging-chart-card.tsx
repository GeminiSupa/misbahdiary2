"use client";

import { SapBarChart } from "@/components/charts/bar-chart";

export type AgingChartCardProps = {
  data: Array<{ label: string; amount: number }>;
};

export function AgingChartCard({ data }: AgingChartCardProps) {
  return (
    <div className="sap-card">
      <div className="sap-card-body space-y-4">
        <div className="sap-card-header">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Aging buckets</h2>
            <p className="text-sm text-muted-foreground">
              Outstanding balances grouped by aging window.
            </p>
          </div>
        </div>
        <SapBarChart data={data} />
      </div>
    </div>
  );
}
