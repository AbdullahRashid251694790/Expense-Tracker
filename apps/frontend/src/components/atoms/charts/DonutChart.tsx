/**
 * DonutChart Component
 * Category spending breakdown visualization
 */

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { cn } from '@/lib/utils/cn';

export interface DonutChartData {
  name: string;
  value: number;
  color: string;
}

export interface DonutChartProps {
  data: DonutChartData[];
  innerRadius?: number;
  outerRadius?: number;
  className?: string;
  showLegend?: boolean;
  centerLabel?: string;
  centerValue?: string;
}

export function DonutChart({
  data,
  innerRadius = 60,
  outerRadius = 80,
  className,
  showLegend = true,
  centerLabel,
  centerValue,
}: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className={cn('w-full', className)}>
      <div className="relative h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              position={{ x: 0, y: 190 }}
              wrapperStyle={{
                left: '50%',
                transform: 'translateX(-50%)',
                pointerEvents: 'none',
              }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as DonutChartData;
                  const percentage = ((item.value / total) * 100).toFixed(1);
                  return (
                    <div className="rounded-bento-sm bg-surface border border-border px-3 py-2 shadow-lg">
                      <p className="text-sm font-medium text-text-primary">
                        {item.name}
                      </p>
                      <p className="text-sm text-text-secondary">
                        ${item.value.toLocaleString()} ({percentage}%)
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        {(centerLabel || centerValue) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {centerValue && (
              <span className="text-2xl font-bold text-text-primary">
                {centerValue}
              </span>
            )}
            {centerLabel && (
              <span className="text-xs text-text-muted">{centerLabel}</span>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-text-secondary">{item.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
