/**
 * Select Component
 * Styled select dropdown following Input pattern
 */

import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const selectVariants = cva(
  [
    'w-full rounded-bento-sm border bg-surface px-3 py-2 pr-10',
    'text-text-primary',
    'transition-colors duration-200',
    'focus:outline-none focus:ring-2 focus:ring-casha-primary focus:border-casha-primary',
    'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-muted',
    'appearance-none cursor-pointer',
  ],
  {
    variants: {
      variant: {
        default: 'border-border hover:border-border-hover',
        error: 'border-error focus:ring-error focus:border-error',
      },
      selectSize: {
        sm: 'h-8 text-sm',
        md: 'h-10 text-sm',
        lg: 'h-12 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      selectSize: 'md',
    },
  }
);

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'>,
    VariantProps<typeof selectVariants> {
  error?: boolean;
  options?: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      variant,
      selectSize,
      error,
      options,
      placeholder,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            selectVariants({
              variant: error ? 'error' : variant,
              selectSize,
            }),
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options
            ? options.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </option>
              ))
            : children}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
      </div>
    );
  }
);

Select.displayName = 'Select';
