"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type DailyView = {
  date: string;
  views: number;
};

type ViewsChartProps = {
  data: DailyView[];
};

function formatDate(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default function ViewsChart({ data }: ViewsChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    label: formatDate(item.date),
  }));

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{
            top: 10,
            right: 10,
            left: -10,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient
              id="viewsGradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="#1687f8"
                stopOpacity={0.22}
              />

              <stop
                offset="100%"
                stopColor="#1687f8"
                stopOpacity={0.02}
              />
            </linearGradient>
          </defs>

          <CartesianGrid
            vertical={false}
            stroke="#e2e8f0"
            strokeDasharray="0"
          />

          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{
              fill: "#64748b",
              fontSize: 12,
            }}
            minTickGap={30}
            dy={10}
          />

          <YAxis
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            tick={{
              fill: "#64748b",
              fontSize: 12,
            }}
            width={45}
          />

          <Tooltip
            cursor={{
              stroke: "#cbd5e1",
              strokeDasharray: "4 4",
            }}
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              background: "#ffffff",
              boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
            }}
            labelStyle={{
              color: "#64748b",
              marginBottom: "4px",
            }}
            itemStyle={{
              color: "#0f172a",
              fontWeight: 600,
            }}
          />

          <Area
            type="monotone"
            dataKey="views"
            name="Views"
            stroke="#1687f8"
            strokeWidth={2.5}
            fill="url(#viewsGradient)"
            activeDot={{
              r: 5,
              fill: "#1687f8",
              stroke: "#ffffff",
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}