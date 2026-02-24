"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { AgentLog } from "@/hooks/use-agent-thinking-log";

interface AgentThinkingTerminalProps {
  logs: AgentLog[];
  isStreaming?: boolean;
}

const logTypeIcons: Record<string, string> = {
  evaluating: "⚙️",
  detected: "🔍",
  decision: "⚡",
  action: "→",
};

const logTypeColors: Record<string, string> = {
  evaluating: "text-muted-foreground",
  detected: "text-amber-grid",
  decision: "text-emerald-electric",
  action: "text-blue-400",
};

/**
 * Terminal-style component showing agent thinking logs
 * Displays: timestamp, log type, and message
 * Auto-scrolls to newest entries
 */
export function AgentThinkingTerminal({ logs, isStreaming = false }: AgentThinkingTerminalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="rounded-xl border border-emerald-electric/30 bg-grid-bg/80 backdrop-blur-sm p-4 font-mono text-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-emerald-electric/20">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isStreaming ? "animate-pulse bg-emerald-electric" : "bg-muted-foreground"}`} />
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Agent Thinking Terminal</p>
        </div>
        <p className="text-xs text-muted-foreground">{logs.length} events</p>
      </div>

      {/* Terminal logs container */}
      <div
        ref={scrollRef}
        className="h-[320px] overflow-y-auto space-y-1 pr-2"
        style={{
          scrollBehavior: "smooth",
        }}
      >
        {logs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
            Waiting for agent activity...
          </div>
        ) : (
          logs.map((log, idx) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="flex gap-2 text-xs"
            >
              {/* Timestamp */}
              <span className="text-muted-foreground flex-shrink-0 w-12">
                [{log.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}]
              </span>

              {/* Log type icon and name */}
              <span className={`flex-shrink-0 w-12 ${logTypeColors[log.type]} font-semibold`}>
                {logTypeIcons[log.type]} {log.type.toUpperCase()}
              </span>

              {/* Message */}
              <span className="text-foreground flex-1 break-words">{log.message}</span>

              {/* Cursor indicator for latest entry */}
              {idx === logs.length - 1 && (
                <motion.span
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  className="text-emerald-electric flex-shrink-0"
                >
                  ▌
                </motion.span>
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* Footer status */}
      <div className="mt-3 pt-3 border-t border-emerald-electric/20 flex justify-between items-center">
        <p className="text-xs text-muted-foreground">
          {isStreaming ? (
            <span className="text-emerald-electric">🟢 Live Stream Active</span>
          ) : (
            <span>⚪ Polling Mode</span>
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          Scroll for history • {logs.length > 0 && `Last update: ${Math.round((Date.now() - logs[logs.length - 1].timestamp.getTime()) / 1000)}s ago`}
        </p>
      </div>
    </div>
  );
}
