"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatZMWFloat } from "@/lib/format";

type Props = {
  prices30d: number[];
  changePercent: number;
};

export function PriceChart({ prices30d, changePercent }: Props) {
  const data = prices30d.map((p, i) => ({
    day: i + 1,
    priceZMW: p / 100,
  }));

  const color = changePercent >= 0 ? "#16a34a" : "#dc2626";
  const minVal = Math.min(...data.map((d) => d.priceZMW));
  const maxVal = Math.max(...data.map((d) => d.priceZMW));
  const padding = (maxVal - minVal) * 0.1 || 0.5;

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <XAxis dataKey="day" hide />
        <YAxis
          domain={[minVal - padding, maxVal + padding]}
          tickFormatter={(v: number) => `${v.toFixed(2)}`}
          width={52}
          tick={{ fontSize: 11 }}
        />
        <Tooltip
          formatter={(value) =>
            typeof value === "number"
              ? [formatZMWFloat(value), "Price"]
              : [String(value), "Price"]
          }
          labelFormatter={(label) => `Day ${label}`}
        />
        <Line
          type="monotone"
          dataKey="priceZMW"
          stroke={color}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
