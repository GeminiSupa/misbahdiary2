"use client";

import dynamic from "next/dynamic";

const ResponsiveContainer = dynamic(
  () => import("recharts").then((mod) => mod.ResponsiveContainer),
  { ssr: false },
);
const BarChart = dynamic(() => import("recharts").then((mod) => mod.BarChart), {
  ssr: false,
});
const Bar = dynamic(() => import("recharts").then((mod) => mod.Bar), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then((mod) => mod.CartesianGrid), {
  ssr: false,
});
const XAxis = dynamic(() => import("recharts").then((mod) => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((mod) => mod.YAxis), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((mod) => mod.Tooltip), { ssr: false });

export type SapBarChartProps = {
  data: Array<{ label: string; amount: number }>;
  height?: number;
};

export function SapBarChart({ data, height = 260 }: SapBarChartProps) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E3EFFA" />
          <XAxis dataKey="label" stroke="#56738C" fontSize={12} axisLine={false} tickLine={false} />
          <YAxis stroke="#56738C" axisLine={false} tickLine={false} fontSize={12} />
          <Tooltip
            cursor={{ fill: "rgba(15,76,129,0.08)" }}
            contentStyle={{ borderRadius: 12, borderColor: "#D5E4F2" }}
            formatter={(value: number) =>
              value.toLocaleString("en-PK", { maximumFractionDigits: 0 })
            }
            labelStyle={{ color: "#073B4C", fontWeight: 600 }}
          />
          <Bar dataKey="amount" fill="#0f4c81" radius={[10, 10, 4, 4]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
