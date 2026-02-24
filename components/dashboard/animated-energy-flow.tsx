"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface AnimatedEnergyFlowProps {
  solarKw: number;
  batteryPercent: number;
  homeLoadKw: number;
  gridToUserKw: number;
  userToGridKw: number;
}

/**
 * Animated SVG showing energy flow between Solar, Battery, Home, and Grid
 * - Marching ants speed tied to solar output (higher kW = faster)
 * - Color-coded paths by energy direction
 * - Real-time animated counters for each flow
 */
export function AnimatedEnergyFlow({
  solarKw,
  batteryPercent,
  homeLoadKw,
  gridToUserKw,
  userToGridKw,
}: AnimatedEnergyFlowProps) {
  const [showDetailed, setShowDetailed] = useState(true);

  // Marching ants speed: Higher solar = faster animation
  // Base: 4s at 1kW, faster as kW increases
  const animationDuration = Math.max(1, 4 / Math.max(solarKw, 1));

  // Animated counter component
  const AnimatedValue = ({ value, decimals = 1 }: { value: number; decimals?: number }) => {
    return (
      <motion.span
        key={value.toFixed(decimals)}
        initial={{ opacity: 0.7, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {value.toFixed(decimals)}
      </motion.span>
    );
  };

  if (!showDetailed) {
    // Simple mode - just show key values
    return (
      <div className="rounded-xl border border-emerald-electric/30 bg-grid-surface/50 backdrop-blur-sm p-6">
        <p className="text-muted-foreground mb-4 text-xs uppercase tracking-wider">Live energy flow</p>
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Solar</p>
            <p className="text-xl font-mono font-bold text-emerald-electric">
              <AnimatedValue value={solarKw} />
            </p>
            <p className="text-xs text-muted-foreground">kW</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Battery</p>
            <p className="text-xl font-mono font-bold text-amber-grid">
              <AnimatedValue value={batteryPercent} decimals={0} />
            </p>
            <p className="text-xs text-muted-foreground">%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Home</p>
            <p className="text-xl font-mono font-bold text-foreground">
              <AnimatedValue value={homeLoadKw} />
            </p>
            <p className="text-xs text-muted-foreground">kW</p>
          </div>
          <button
            onClick={() => setShowDetailed(true)}
            className="col-span-1 rounded border border-emerald-electric/50 px-2 py-1 text-xs text-emerald-electric hover:bg-emerald-electric/10 transition-colors"
          >
            Details
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-emerald-electric/30 bg-grid-surface/50 backdrop-blur-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <p className="text-muted-foreground text-xs uppercase tracking-wider">Live energy flow (animated)</p>
        <button
          onClick={() => setShowDetailed(false)}
          className="rounded border border-emerald-electric/50 px-2 py-1 text-xs text-emerald-electric hover:bg-emerald-electric/10 transition-colors"
        >
          Simple
        </button>
      </div>

      {/* SVG Energy Flow Diagram */}
      <svg viewBox="0 0 800 400" className="w-full h-auto mb-4" style={{ minHeight: "250px" }}>
        {/* Define patterns for marching ants */}
        <defs>
          <style>{`
            @keyframes marchAnts {
              0% { stroke-dashoffset: 0; }
              100% { stroke-dashoffset: -20; }
            }
            .marching-line {
              stroke-dasharray: 10, 5;
              animation: marchAnts ${animationDuration}s linear infinite;
            }
          `}</style>
          <marker id="arrowGreen" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill="#00ff88" />
          </marker>
          <marker id="arrowAmber" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill="#ffbf00" />
          </marker>
          <marker id="arrowBlue" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill="#3b82f6" />
          </marker>
        </defs>

        {/* Source nodes */}
        <circle cx="100" cy="100" r="35" fill="none" stroke="#00ff88" strokeWidth="2" />
        <text x="100" y="100" textAnchor="middle" dy="0.3em" className="fill-emerald-electric font-bold text-xs">
          Solar
        </text>
        <text x="100" y="125" textAnchor="middle" className="fill-emerald-electric font-mono text-sm font-bold">
          <AnimatedValue value={solarKw} />
          kW
        </text>

        <circle cx="700" cy="100" r="35" fill="none" stroke="#3b82f6" strokeWidth="2" />
        <text x="700" y="100" textAnchor="middle" dy="0.3em" className="fill-blue-400 font-bold text-xs">
          Grid
        </text>

        {/* Central hub (battery) */}
        <rect x="375" y="175" width="50" height="50" fill="none" stroke="#ffbf00" strokeWidth="2" rx="4" />
        <text x="400" y="205" textAnchor="middle" className="fill-amber-grid font-bold text-xs">
          Battery
        </text>

        {/* Home load */}
        <circle cx="100" cy="300" r="35" fill="none" stroke="#f59e0b" strokeWidth="2" />
        <text x="100" y="300" textAnchor="middle" dy="0.3em" className="fill-amber-500 font-bold text-xs">
          Home
        </text>
        <text x="100" y="325" textAnchor="middle" className="fill-amber-500 font-mono text-sm font-bold">
          <AnimatedValue value={homeLoadKw} />
          kW
        </text>

        {/* Energy flows - Solar to Battery */}
        {solarKw > 0.1 && (
          <>
            <line
              x1="130" y1="100"
              x2="375" y2="200"
              className="marching-line"
              stroke="#00ff88"
              strokeWidth="2"
              markerEnd="url(#arrowGreen)"
              opacity="0.8"
            />
            <text x="200" y="140" className="fill-emerald-electric font-mono text-xs font-bold">
              <AnimatedValue value={solarKw * 0.6} decimals={2} /> kW
            </text>
          </>
        )}

        {/* Battery to Home */}
        {batteryPercent > 10 && (
          <>
            <line
              x1="375" y1="225"
              x2="130" y2="300"
              className="marching-line"
              stroke="#ffbf00"
              strokeWidth="2"
              markerEnd="url(#arrowAmber)"
              opacity="0.8"
            />
            <text x="250" y="280" className="fill-amber-grid font-mono text-xs font-bold">
              <AnimatedValue value={Math.min(homeLoadKw, batteryPercent / 100 * 3)} decimals={2} /> kW
            </text>
          </>
        )}

        {/* Home to Grid (selling) */}
        {userToGridKw > 0.1 && (
          <>
            <line
              x1="130" y1="300"
              x2="665" y2="100"
              className="marching-line"
              stroke="#f59e0b"
              strokeWidth="2"
              markerEnd="url(#arrowAmber)"
              opacity="0.8"
            />
            <text x="350" y="230" className="fill-amber-500 font-mono text-xs font-bold">
              +<AnimatedValue value={userToGridKw} decimals={2} /> kW
            </text>
          </>
        )}

        {/* Grid to Home (buying) */}
        {gridToUserKw > 0.1 && (
          <>
            <line
              x1="700" y1="100"
              x2="130" y2="300"
              className="marching-line"
              stroke="#3b82f6"
              strokeWidth="2"
              markerEnd="url(#arrowBlue)"
              opacity="0.8"
            />
            <text x="450" y="170" className="fill-blue-400 font-mono text-xs font-bold">
              <AnimatedValue value={gridToUserKw} decimals={2} /> kW
            </text>
          </>
        )}
      </svg>

      {/* Stats summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center text-sm">
        <div className="rounded border border-emerald-electric/20 bg-emerald-electric/5 p-2">
          <p className="text-xs text-muted-foreground">Solar</p>
          <p className="font-mono font-bold text-emerald-electric">
            <AnimatedValue value={solarKw} /> kW
          </p>
        </div>
        <div className="rounded border border-amber-grid/20 bg-amber-grid/5 p-2">
          <p className="text-xs text-muted-foreground">Battery</p>
          <p className="font-mono font-bold text-amber-grid">
            <AnimatedValue value={batteryPercent} decimals={0} />%
          </p>
        </div>
        <div className="rounded border border-amber-500/20 bg-amber-500/5 p-2">
          <p className="text-xs text-muted-foreground">Home Load</p>
          <p className="font-mono font-bold text-amber-500">
            <AnimatedValue value={homeLoadKw} decimals={2} /> kW
          </p>
        </div>
        <div className="rounded border border-blue-400/20 bg-blue-400/5 p-2">
          <p className="text-xs text-muted-foreground">Net Flow</p>
          <p className={`font-mono font-bold ${userToGridKw > gridToUserKw ? "text-emerald-electric" : "text-blue-400"}`}>
            {userToGridKw > gridToUserKw ? "+" : "-"}
            <AnimatedValue value={Math.abs(userToGridKw - gridToUserKw)} decimals={2} /> kW
          </p>
        </div>
      </div>
    </div>
  );
}
