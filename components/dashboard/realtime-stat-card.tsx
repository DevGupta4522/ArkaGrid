"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";

interface RealtimeStatCardProps {
  label: string;
  value: number | string;
  unit?: string;
  trend?: number; // positive or negative for trending
  icon?: React.ReactNode;
  color?: "emerald" | "amber" | "rose" | "blue";
  loading?: boolean;
}

const colorClasses = {
  emerald: {
    text: "text-emerald-electric",
    bg: "bg-emerald-electric/10",
    border: "border-emerald-electric/30",
  },
  amber: {
    text: "text-amber-grid",
    bg: "bg-amber-grid/10",
    border: "border-amber-grid/30",
  },
  rose: {
    text: "text-rose-500",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
  },
  blue: {
    text: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-400/30",
  },
};

/**
 * Reusable stat card component for dashboard
 * Shows key metrics with animated value transitions
 */
export function RealtimeStatCard({
  label,
  value,
  unit,
  trend,
  icon,
  color = "emerald",
  loading = false,
}: RealtimeStatCardProps) {
  const colorSet = colorClasses[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`rounded-xl border ${colorSet.border} ${colorSet.bg} backdrop-blur-sm p-4`}
    >
      {/* Header with icon and label */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        {icon ? (
          <div className={colorSet.text}>{icon}</div>
        ) : null}
      </div>

      {/* Main value */}
      <div className="mb-2">
        <motion.div
          key={typeof value === "number" ? value.toFixed(0) : value}
          initial={{ scale: 0.9, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          <p className={`text-3xl font-mono font-bold ${colorSet.text}`}>
            {loading ? "—" : value}
            {unit && <span className="text-xl ml-1">{unit}</span>}
          </p>
        </motion.div>
      </div>

      {/* Trend indicator */}
      {trend !== undefined && (
        <div className="flex items-center gap-1">
          {trend > 0 ? (
            <>
              <TrendingUp className="h-3 w-3 text-emerald-electric" />
              <span className="text-xs text-emerald-electric font-medium">
                +{Math.abs(trend).toFixed(0)}% today
              </span>
            </>
          ) : trend < 0 ? (
            <>
              <TrendingDown className="h-3 w-3 text-rose-500" />
              <span className="text-xs text-rose-500 font-medium">
                {Math.abs(trend).toFixed(0)}% down
              </span>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">No change</span>
          )}
        </div>
      )}
    </motion.div>
  );
}
