"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

const AreaChart = dynamic(() => import("recharts").then((mod) => mod.AreaChart), {
  ssr: false,
});
const Area = dynamic(() => import("recharts").then((mod) => mod.Area), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((mod) => mod.Tooltip), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((mod) => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((mod) => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then((mod) => mod.CartesianGrid), {
  ssr: false,
});
const ResponsiveContainer = dynamic(
  () => import("recharts").then((mod) => mod.ResponsiveContainer),
  { ssr: false },
);

export type AreaChartProps = {
  data: ComponentProps<typeof AreaChart>["data"];
  dataKey: string;
  secondaryKey?: string;
  height?: number;
  name?: string;
};

export function SapAreaChart({ data, dataKey, secondaryKey, height = 260, name }: AreaChartProps) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="sapPrimary" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0f4c81" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#0f4c81" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="sapSecondary" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06aed5" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#06aed5" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E3EFFA" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} stroke="#56738C" fontSize={12} />
          <YAxis tickLine={false} axisLine={false} stroke="#56738C" fontSize={12} />
          <Tooltip
            cursor={{ stroke: "#0f4c81", strokeWidth: 1, strokeDasharray: "4 4" }}
            contentStyle={{ borderRadius: 12, borderColor: "#D5E4F2" }}
            formatter={(value: number) => value.toLocaleString("en-PK", { maximumFractionDigits: 0 })}
            labelStyle={{ color: "#073B4C", fontWeight: 600 }}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke="#0f4c81"
            strokeWidth={2}
            fill="url(#sapPrimary)"
            name={name ?? "Invoices"}
          />
          {secondaryKey ? (
            <Area
              type="monotone"
              dataKey={secondaryKey}
              stroke="#06aed5"
              strokeWidth={2}
              fill="url(#sapSecondary)"
              name="Outstanding"
            />
          ) : null}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
