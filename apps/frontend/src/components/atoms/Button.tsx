import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/**
 * Button Component
 * Primary action component with multiple variants
 *
 * SOLID-S: Single responsibility - button actions only
 * DRY: Centralized variants using CVA
 */

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2',
    'font-medium rounded-bento-sm',
    'transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-casha-primary focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-casha-primary text-white',
          'hover:bg-casha-primary-dark',
          'active:scale-[0.98]',
        ],
        secondary: [
          'bg-surface text-text-primary border border-border',
          'hover:bg-surface-hover hover:border-border-hover',
          'active:scale-[0.98]',
        ],
        ghost: [
          'bg-transparent text-text-secondary',
          'hover:bg-surface-hover hover:text-text-primary',
        ],
        danger: [
          'bg-error text-white',
          'hover:bg-red-600',
          'active:scale-[0.98]',
        ],
        link: [
          'bg-transparent text-casha-primary underline-offset-4',
          'hover:underline',
        ],
      },
      size: {
        sm: 'h-9 px-3 text-sm min-w-[44px]',
        md: 'h-11 px-4 text-sm min-w-[44px]',
        lg: 'h-12 px-6 text-base min-w-[48px]',
        icon: 'h-12 w-12',
        'icon-sm': 'h-11 w-11',
        'icon-touch': 'h-12 w-12 min-w-[48px]',
      },
      fullWidth: {
        true: 'w-full',
        false: 'w-auto',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      isLoading,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, fullWidth }), className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
