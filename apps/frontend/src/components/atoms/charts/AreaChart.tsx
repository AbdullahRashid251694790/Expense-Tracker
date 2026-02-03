/**
 * AreaChart Component
 * Spending trends over time visualization
 */

import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils/cn';

export interface AreaChartData {
  date: string;
  value: number;
  [key: string]: string | number;
}

export interface AreaChartProps {
  data: AreaChartData[];
  className?: string;
  dataKey?: string;
  color?: string;
  gradientFrom?: string;
  gradientTo?: string;
  showGrid?: boolean;
  showAxis?: boolean;
  valueFormatter?: (value: number) => string;
  dateFormatter?: (date: string) => string;
}

export function AreaChart({
  data,
  className,
  dataKey = 'value',
  color = 'hsl(var(--casha-primary))',
  gradientFrom,
  gradientTo = 'transparent',
  showGrid = true,
  showAxis = true,
  valueFormatter = (value) => `$${value.toLocaleString()}`,
  dateFormatter = (date) => date,
}: AreaChartProps) {
  const gradientId = `gradient-${dataKey}`;
  const fromColor = gradientFrom || color;

  return (
    <div className={cn('w-full h-[250px]', className)}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsAreaChart
          data={data}
          margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={fromColor} stopOpacity={0.3} />
              <stop offset="100%" stopColor={gradientTo} stopOpacity={0} />
            </linearGradient>
          </defs>

          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              opacity={0.5}
              vertical={false}
            />
          )}

          {showAxis && (
            <>
              <XAxis
                dataKey="date"
                stroke="hsl(var(--text-muted))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={dateFormatter}
              />
              <YAxis
                stroke="hsl(var(--text-muted))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
              />
            </>
          )}

          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-bento-sm bg-surface border border-border px-3 py-2 shadow-lg">
                    <p className="text-sm font-medium text-text-primary">
                      {dateFormatter(label)}
                    </p>
                    <p className="text-sm text-text-secondary">
                      {valueFormatter(payload[0].value as number)}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />

          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{
              r: 4,
              fill: color,
              stroke: 'hsl(var(--surface))',
              strokeWidth: 2,
            }}
          />
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * MultiAreaChart
 * Multiple data series comparison
 */
export interface MultiAreaChartSeries {
  dataKey: string;
  color: string;
  name: string;
}

export interface MultiAreaChartProps {
  data: AreaChartData[];
  series: MultiAreaChartSeries[];
  className?: string;
  showGrid?: boolean;
  showAxis?: boolean;
  showLegend?: boolean;
  valueFormatter?: (value: number) => string;
  dateFormatter?: (date: string) => string;
}

export function MultiAreaChart({
  data,
  series,
  className,
  showGrid = true,
  showAxis = true,
  showLegend = true,
  valueFormatter = (value) => `$${value.toLocaleString()}`,
  dateFormatter = (date) => date,
}: MultiAreaChartProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsAreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
          >
            <defs>
              {series.map((s) => (
                <linearGradient
                  key={s.dataKey}
                  id={`gradient-${s.dataKey}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={s.color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>

            {showGrid && (
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                opacity={0.5}
                vertical={false}
              />
            )}

            {showAxis && (
              <>
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--text-muted))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={dateFormatter}
                />
                <YAxis
                  stroke="hsl(var(--text-muted))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value}`}
                />
              </>
            )}

            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-bento-sm bg-surface border border-border px-3 py-2 shadow-lg">
                      <p className="text-sm font-medium text-text-primary mb-1">
                        {dateFormatter(label)}
                      </p>
                      {payload.map((p, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: p.color }}
                          />
                          <span className="text-sm text-text-secondary">
                            {p.name}: {valueFormatter(p.value as number)}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />

            {series.map((s) => (
              <Area
                key={s.dataKey}
                type="monotone"
                dataKey={s.dataKey}
                name={s.name}
                stroke={s.color}
                strokeWidth={2}
                fill={`url(#gradient-${s.dataKey})`}
                dot={false}
              />
            ))}
          </RechartsAreaChart>
        </ResponsiveContainer>
      </div>

      {showLegend && (
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          {series.map((s) => (
            <div key={s.dataKey} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-sm text-text-secondary">{s.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
