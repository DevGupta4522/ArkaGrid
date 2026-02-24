"use client";

import { useQuery } from "@tanstack/react-query";
import { getGridHealthScore } from "@/lib/agents/grid-shield";

export function useGridHealth(refreshMs = 5000) {
  return useQuery({
    queryKey: ["grid-health"],
    queryFn: getGridHealthScore,
    refetchInterval: refreshMs,
  });
}
