import { type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

/**
 * Badge Component
 * Status/category indicator badges
 *
 * SOLID-S: Single responsibility - visual indicator only
 */

const badgeVariants = cva(
  [
    'inline-flex items-center gap-1.5',
    'font-medium rounded-full',
    'transition-colors duration-200',
  ],
  {
    variants: {
      variant: {
        default: 'bg-surface-muted text-text-secondary',
        primary: 'bg-casha-primary/10 text-casha-primary',
        success: 'bg-success/10 text-success',
        warning: 'bg-warning/10 text-warning',
        error: 'bg-error/10 text-error',
        info: 'bg-info/10 text-info',
        // Category badges
        food: 'bg-cat-food/10 text-cat-food',
        transport: 'bg-cat-transport/10 text-cat-transport',
        bills: 'bg-cat-bills/10 text-cat-bills',
        entertainment: 'bg-cat-entertainment/10 text-cat-entertainment',
        shopping: 'bg-cat-shopping/10 text-cat-shopping',
        health: 'bg-cat-health/10 text-cat-health',
        other: 'bg-cat-other/10 text-cat-other',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-xs',
        lg: 'px-3 py-1.5 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
  dotColor?: string;
}

export function Badge({
  className,
  variant,
  size,
  dot,
  dotColor,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    >
      {dot && (
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: dotColor || 'currentColor' }}
        />
      )}
      {children}
    </span>
  );
}

/**
 * Category Badge - convenience component for expense categories
 */
export interface CategoryBadgeProps {
  category: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function CategoryBadge({
  category,
  color,
  size = 'md',
  className,
}: CategoryBadgeProps) {
  // Map category names to badge variants
  const variantMap: Record<string, VariantProps<typeof badgeVariants>['variant']> = {
    food: 'food',
    transport: 'transport',
    bills: 'bills',
    entertainment: 'entertainment',
    shopping: 'shopping',
    health: 'health',
    other: 'other',
  };

  const variant = variantMap[category.toLowerCase()] || 'default';

  return (
    <Badge
      variant={variant}
      size={size}
      dot={!!color}
      dotColor={color}
      className={className}
    >
      {category}
    </Badge>
  );
}
