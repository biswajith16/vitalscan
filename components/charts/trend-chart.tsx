"use client";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ScanRecord } from "@/types/scan";
export default function TrendChart({
  scans,
  metric,
}: {
  scans: ScanRecord[];
  metric: "heartRate" | "signalQuality";
}) {
  const data = [...scans]
    .reverse()
    .map((s) => ({
      ...s,
      label: new Date(s.createdAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      timestamp: new Date(s.createdAt).toLocaleString(),
    }));
  const name =
    metric === "heartRate" ? "Heart-rate estimate" : "Signal quality";
  return (
    <div
      className="trend-chart"
      role="img"
      aria-label={`${name} chart. Exact values are in the accessible reading table below.`}
    >
      <ResponsiveContainer width="100%" height={260}>
        <LineChart
          data={data}
          margin={{ top: 15, right: 12, left: -20, bottom: 0 }}
          accessibilityLayer
        >
          <CartesianGrid
            strokeDasharray="3 5"
            vertical={false}
            stroke="#e4eae8"
          />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#586b71" }}
            minTickGap={35}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#586b71" }}
            domain={metric === "signalQuality" ? [0, 100] : ["auto", "auto"]}
          />
          <Tooltip
            content={({ active, payload }) => {
              const scan = payload?.[0]?.payload as
                (ScanRecord & { timestamp: string }) | undefined;
              return active && scan ? (
                <div className="chart-tooltip">
                  <strong>
                    {scan[metric]} {metric === "heartRate" ? "BPM" : "%"}
                  </strong>
                  <span>{scan.timestamp}</span>
                  <span>Signal quality: {scan.signalQuality}%</span>
                </div>
              ) : null;
            }}
          />
          <Line
            type="linear"
            dataKey={metric}
            name={name}
            stroke={metric === "heartRate" ? "#267c70" : "#506da3"}
            strokeWidth={2.5}
            dot={{ r: 4, fill: "#fff", strokeWidth: 2 }}
            activeDot={{ r: 7 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
