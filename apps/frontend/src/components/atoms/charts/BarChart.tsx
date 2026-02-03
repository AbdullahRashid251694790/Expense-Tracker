/**
 * BarChart Component
 * Budget vs Spent comparison visualization
 */

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { cn } from '@/lib/utils/cn';

export interface BarChartData {
  name: string;
  value: number;
  color?: string;
  secondaryValue?: number;
  secondaryColor?: string;
}

export interface BarChartProps {
  data: BarChartData[];
  className?: string;
  layout?: 'horizontal' | 'vertical';
  showGrid?: boolean;
  showAxis?: boolean;
  barSize?: number;
  valueFormatter?: (value: number) => string;
}

const defaultColors = {
  primary: 'hsl(var(--casha-primary))',
  secondary: 'hsl(var(--text-muted))',
};

export function BarChart({
  data,
  className,
  layout = 'horizontal',
  showGrid = true,
  showAxis = true,
  barSize = 24,
  valueFormatter = (value) => `$${value.toLocaleString()}`,
}: BarChartProps) {
  const isVertical = layout === 'vertical';

  return (
    <div className={cn('w-full h-[250px]', className)}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={data}
          layout={isVertical ? 'vertical' : 'horizontal'}
          margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
        >
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              opacity={0.5}
            />
          )}

          {showAxis && (
            <>
              {isVertical ? (
                <>
                  <XAxis
                    type="number"
                    stroke="hsl(var(--text-muted))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="hsl(var(--text-muted))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    width={80}
                  />
                </>
              ) : (
                <>
                  <XAxis
                    dataKey="name"
                    stroke="hsl(var(--text-muted))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
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
            </>
          )}

          <Tooltip
            cursor={{ fill: 'hsl(var(--surface-hover))' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as BarChartData;
                return (
                  <div className="rounded-bento-sm bg-surface border border-border px-3 py-2 shadow-lg">
                    <p className="text-sm font-medium text-text-primary">
                      {item.name}
                    </p>
                    <p className="text-sm text-text-secondary">
                      {valueFormatter(item.value)}
                    </p>
                    {item.secondaryValue !== undefined && (
                      <p className="text-sm text-text-muted">
                        Budget: {valueFormatter(item.secondaryValue)}
                      </p>
                    )}
                  </div>
                );
              }
              return null;
            }}
          />

          <Bar
            dataKey="value"
            radius={[4, 4, 0, 0]}
            barSize={barSize}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || defaultColors.primary}
              />
            ))}
          </Bar>

          {data.some((d) => d.secondaryValue !== undefined) && (
            <Bar
              dataKey="secondaryValue"
              radius={[4, 4, 0, 0]}
              barSize={barSize}
              opacity={0.3}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-secondary-${index}`}
                  fill={entry.secondaryColor || defaultColors.secondary}
                />
              ))}
            </Bar>
          )}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * BudgetComparisonBar
 * Horizontal bar showing spent vs budget
 */
export interface BudgetComparisonBarProps {
  spent: number;
  budget: number;
  label: string;
  color?: string;
  className?: string;
}

export function BudgetComparisonBar({
  spent,
  budget,
  label,
  color = 'hsl(var(--casha-primary))',
  className,
}: BudgetComparisonBarProps) {
  const percentage = Math.min((spent / budget) * 100, 100);
  const isOverBudget = spent > budget;

  return (
    <div className={cn('w-full', className)}>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-text-primary">{label}</span>
        <span className="text-sm text-text-secondary">
          ${spent.toLocaleString()} / ${budget.toLocaleString()}
        </span>
      </div>
      <div className="relative h-3 bg-surface-muted rounded-full overflow-hidden">
        <div
          className={cn(
            'absolute inset-y-0 left-0 rounded-full transition-all duration-500',
            isOverBudget ? 'bg-error' : ''
          )}
          style={{
            width: `${percentage}%`,
            backgroundColor: isOverBudget ? undefined : color,
          }}
        />
        {/* Budget marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-text-muted"
          style={{ left: '100%' }}
        />
      </div>
      {isOverBudget && (
        <p className="text-xs text-error mt-1">
          Over budget by ${(spent - budget).toLocaleString()}
        </p>
      )}
    </div>
  );
}
