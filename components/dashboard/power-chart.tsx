"use client";

import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// Mock data for last 24 hours
function generateChartData() {
  const data = [];
  for (let i = 0; i < 24; i++) {
    const hour = i;
    // Solar peaks at noon
    const solar = Math.max(0, Math.sin((hour - 6) * Math.PI / 12) * 5);
    // Battery varies throughout day
    const battery = 50 + Math.sin(hour * Math.PI / 12) * 25;
    // Home load baseline with variations
    const homeLoad = 1.5 + Math.sin(hour * Math.PI / 12) * 0.8;

    data.push({
      time: `${hour}:00`,
      solar: parseFloat(solar.toFixed(2)),
      battery: parseFloat(battery.toFixed(1)),
      homeLoad: parseFloat(homeLoad.toFixed(2)),
      bought: parseFloat((homeLoad - solar).toFixed(2)),
      sold: parseFloat(Math.max(0, solar - homeLoad).toFixed(2)),
    });
  }
  return data;
}

/**
 * Multi-chart component showing:
 * - Solar output over 24 hours (line)
 * - Battery % (area)
 * - Energy bought vs sold (bar)
 * All with smooth animations and interactive tooltips
 */
export function PowerChart() {
  const data = generateChartData();

  const chartConfig = {
    margin: { top: 5, right: 20, left: 0, bottom: 5 },
    responsive: true,
  };

  return (
    <div className="rounded-xl border border-emerald-electric/30 bg-grid-surface/50 backdrop-blur-sm p-6 space-y-6">
      {/* Solar Output Chart */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-electric" />
          Solar Output (24h)
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data} margin={chartConfig.margin}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(30, 30, 46, 0.5)" />
            <XAxis
              dataKey="time"
              tick={{ fill: "rgba(113, 113, 122, 0.8)", fontSize: 12 }}
              stroke="rgba(30, 30, 46, 0.8)"
            />
            <YAxis
              tick={{ fill: "rgba(113, 113, 122, 0.8)", fontSize: 12 }}
              stroke="rgba(30, 30, 46, 0.8)"
              label={{ value: "kW", angle: -90, position: "insideLeft" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(10, 10, 15, 0.95)",
                border: "1px solid rgba(0, 255, 136, 0.5)",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "rgba(0, 255, 136, 1)" }}
              formatter={(value: number | undefined) => value ? [`${value.toFixed(2)} kW`, "Solar"] : ["-", "Solar"]}
            />
            <Line
              type="monotone"
              dataKey="solar"
              stroke="#00ff88"
              strokeWidth={2}
              dot={false}
              isAnimationActive={true}
              animationDuration={1000}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Battery Level Chart */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-grid" />
          Battery Level (24h)
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={data} margin={chartConfig.margin}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(30, 30, 46, 0.5)" />
            <XAxis
              dataKey="time"
              tick={{ fill: "rgba(113, 113, 122, 0.8)", fontSize: 12 }}
              stroke="rgba(30, 30, 46, 0.8)"
            />
            <YAxis
              tick={{ fill: "rgba(113, 113, 122, 0.8)", fontSize: 12 }}
              stroke="rgba(30, 30, 46, 0.8)"
              domain={[0, 100]}
              label={{ value: "%", angle: -90, position: "insideLeft" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(10, 10, 15, 0.95)",
                border: "1px solid rgba(255, 191, 0, 0.5)",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "rgba(255, 191, 0, 1)" }}
              formatter={(value: number | undefined) => value ? [`${value.toFixed(0)}%`, "Battery"] : ["-", "Battery"]}
            />
            <Area
              type="monotone"
              dataKey="battery"
              fill="#ffbf00"
              fillOpacity={0.2}
              stroke="#ffbf00"
              strokeWidth={2}
              isAnimationActive={true}
              animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Energy Trade Chart */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-400" />
          Energy Bought vs Sold (24h)
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data} margin={chartConfig.margin}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(30, 30, 46, 0.5)" />
            <XAxis
              dataKey="time"
              tick={{ fill: "rgba(113, 113, 122, 0.8)", fontSize: 12 }}
              stroke="rgba(30, 30, 46, 0.8)"
            />
            <YAxis
              tick={{ fill: "rgba(113, 113, 122, 0.8)", fontSize: 12 }}
              stroke="rgba(30, 30, 46, 0.8)"
              label={{ value: "kWh", angle: -90, position: "insideLeft" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(10, 10, 15, 0.95)",
                border: "1px solid rgba(59, 130, 246, 0.5)",
                borderRadius: "8px",
              }}
              labelStyle={{ color: "rgba(59, 130, 246, 1)" }}
              formatter={(value: number | undefined) => value ? `${value.toFixed(2)} kWh` : "-"}
            />
            <Legend
              wrapperStyle={{ paddingTop: "10px" }}
            />
            <Bar
              dataKey="bought"
              fill="#3b82f6"
              isAnimationActive={true}
              animationDuration={1000}
              name="Bought from Grid"
            />
            <Bar
              dataKey="sold"
              fill="#00ff88"
              isAnimationActive={true}
              animationDuration={1000}
              name="Sold to Grid"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
