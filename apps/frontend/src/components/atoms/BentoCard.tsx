import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

/**
 * BentoCard Component
 * Base card container for Bento grid layouts
 *
 * SOLID-S: Single responsibility - card container only
 * DRY: Centralized variants using CVA
 * KISS: Simple container with optional header/footer
 */

const bentoCardVariants = cva(
  [
    'bg-surface rounded-bento border border-border',
    'transition-all duration-200',
  ],
  {
    variants: {
      variant: {
        default: 'shadow-bento',
        elevated: 'shadow-bento-md',
        flat: 'shadow-none',
        outline: 'bg-transparent',
      },
      padding: {
        none: 'p-0',
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
      },
      hover: {
        none: '',
        lift: 'hover:shadow-bento-lg hover:-translate-y-0.5 cursor-pointer',
        glow: 'hover:border-casha-primary/50 hover:shadow-bento-md cursor-pointer',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
      hover: 'none',
    },
  }
);

export interface BentoCardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof bentoCardVariants> {
  header?: ReactNode;
  footer?: ReactNode;
  headerClassName?: string;
  footerClassName?: string;
  contentClassName?: string;
}

export const BentoCard = forwardRef<HTMLDivElement, BentoCardProps>(
  (
    {
      className,
      variant,
      padding,
      hover,
      header,
      footer,
      headerClassName,
      footerClassName,
      contentClassName,
      children,
      ...props
    },
    ref
  ) => {
    const hasHeader = !!header;
    const hasFooter = !!footer;

    return (
      <div
        ref={ref}
        className={cn(
          bentoCardVariants({
            variant,
            padding: hasHeader || hasFooter ? 'none' : padding,
            hover,
          }),
          className
        )}
        {...props}
      >
        {/* Header */}
        {hasHeader && (
          <div
            className={cn(
              'px-4 py-3 border-b border-border',
              'font-medium text-text-primary',
              headerClassName
            )}
          >
            {header}
          </div>
        )}

        {/* Content */}
        <div
          className={cn(
            hasHeader || hasFooter ? 'p-4' : '',
            contentClassName
          )}
        >
          {children}
        </div>

        {/* Footer */}
        {hasFooter && (
          <div
            className={cn(
              'px-4 py-3 border-t border-border',
              'text-sm text-text-secondary',
              footerClassName
            )}
          >
            {footer}
          </div>
        )}
      </div>
    );
  }
);

BentoCard.displayName = 'BentoCard';
