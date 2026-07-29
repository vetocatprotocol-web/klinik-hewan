"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

export interface OccupancyDataPoint {
  date: string;
  occupied: number;
  available: number;
  maintenance: number;
}

export interface OccupancyChartProps {
  data: OccupancyDataPoint[];
  title?: string;
  className?: string;
}

export function OccupancyChart({
  data,
  title = "Okupansi Hotel",
  className,
}: OccupancyChartProps) {
  if (data.length === 0) {
    return (
      <div className={cn("w-full", className)}>
        {title && (
          <h3 className="text-lg font-semibold mb-4">{title}</h3>
        )}
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          Tidak ada data
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      {title && (
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
          />
          <YAxis
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "14px",
            }}
          />
          <Legend />
          <Bar
            dataKey="occupied"
            name="Terisi"
            fill="#3b82f6"
            stackId="occupancy"
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="available"
            name="Tersedia"
            fill="#22c55e"
            stackId="occupancy"
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="maintenance"
            name="Perawatan"
            fill="#f59e0b"
            stackId="occupancy"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
