"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const VisitsChart = dynamic(
  () => import("@/components/charts/visits-chart").then((m) => m.VisitsChart),
  {
    loading: () => <Skeleton className="h-[300px] rounded-lg" />,
    ssr: false,
  }
);

const RevenueChart = dynamic(
  () => import("@/components/charts/revenue-chart").then((m) => m.RevenueChart),
  {
    loading: () => <Skeleton className="h-[300px] rounded-lg" />,
    ssr: false,
  }
);

export { VisitsChart, RevenueChart };
