"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import type { AgentMode } from "@/types";
import { Bot, Hand } from "lucide-react";

interface AgentStatusToggleProps {
  mode: AgentMode;
  onModeChange: (mode: AgentMode) => void;
  disabled?: boolean;
}

export function AgentStatusToggle({
  mode,
  onModeChange,
  disabled,
}: AgentStatusToggleProps) {
  const isAutopilot = mode === "autopilot";
  return (
    <Card className="border-amber-grid/30">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {isAutopilot ? (
              <Bot className="h-6 w-6 text-amber-grid" />
            ) : (
              <Hand className="h-6 w-6 text-muted-foreground" />
            )}
            <div>
              <Label className="text-base font-medium">
                {isAutopilot ? "Autopilot" : "Manual"}
              </Label>
              <p className="text-xs text-muted-foreground">
                {isAutopilot
                  ? "Agent trades based on battery & grid price"
                  : "You control when to buy/sell"}
              </p>
            </div>
          </div>
          <Switch
            checked={isAutopilot}
            onCheckedChange={(checked) =>
              onModeChange(checked ? "autopilot" : "manual")
            }
            disabled={disabled}
          />
        </div>
      </CardContent>
    </Card>
  );
}
