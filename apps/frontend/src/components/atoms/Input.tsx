import { forwardRef, type InputHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

/**
 * Input Component
 * Form input field with variants for different states
 *
 * SOLID-S: Single responsibility - text input only
 */

const inputVariants = cva(
  [
    'w-full rounded-bento-sm border bg-surface px-3 py-2',
    'text-text-primary placeholder:text-text-muted',
    'transition-colors duration-200',
    'focus:outline-none focus:ring-2 focus:ring-casha-primary focus:border-casha-primary',
    'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-muted',
  ],
  {
    variants: {
      variant: {
        default: 'border-border hover:border-border-hover',
        error: 'border-error focus:ring-error focus:border-error',
      },
      inputSize: {
        sm: 'h-8 text-sm',
        md: 'h-10 text-sm',
        lg: 'h-12 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      inputSize: 'md',
    },
  }
);

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, inputSize, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          inputVariants({
            variant: error ? 'error' : variant,
            inputSize,
          }),
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

/**
 * Textarea Component
 */
export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'w-full rounded-bento-sm border bg-surface px-3 py-2',
          'text-text-primary placeholder:text-text-muted',
          'transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-casha-primary focus:border-casha-primary',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'min-h-[80px] resize-y',
          error
            ? 'border-error focus:ring-error focus:border-error'
            : 'border-border hover:border-border-hover',
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';
