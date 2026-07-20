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
import type { SeriePonto } from "./queries";

type TooltipPayload = { payload: SeriePonto }[];

/** Pílula flutuante do hover (mesmo formato da referência). */
function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayload;
}) {
  if (!active || !payload?.length) return null;
  const ponto = payload[0].payload;

  return (
    <div className="glass-panel rounded-lg px-3 py-1.5 text-xs">
      <span className="text-muted">{ponto.mes}</span>{" "}
      <span className="font-semibold text-text">
        {ponto.contatos} {ponto.contatos === 1 ? "contato" : "contatos"}
      </span>
    </div>
  );
}

export function ContactsChart({ data }: { data: SeriePonto[] }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <defs>
            {/* gradiente laranja sob a linha, como na referência */}
            <linearGradient id="grad-contatos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            vertical={false}
            strokeDasharray="4 4"
            stroke="var(--border)"
          />
          <XAxis
            dataKey="mes"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--text-subtle)", fontSize: 12 }}
            dy={6}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            width={44}
            tick={{ fill: "var(--text-subtle)", fontSize: 12 }}
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ stroke: "var(--border-strong)", strokeDasharray: "4 4" }}
          />
          <Area
            type="monotone"
            dataKey="contatos"
            stroke="var(--brand)"
            strokeWidth={2}
            fill="url(#grad-contatos)"
            activeDot={{
              r: 4,
              fill: "var(--brand)",
              stroke: "var(--bg)",
              strokeWidth: 3,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
