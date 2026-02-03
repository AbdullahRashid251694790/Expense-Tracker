/**
 * FormField Molecule
 * Label + Input + Error message combination
 *
 * SOLID-S: Form field composition only
 */

import { type ReactNode, forwardRef } from 'react';
import { Input, type InputProps } from '@/components/atoms';
import { cn } from '@/lib/utils/cn';

export interface FormFieldProps extends Omit<InputProps, 'error'> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  containerClassName?: string;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  (
    {
      label,
      error,
      hint,
      required,
      leftIcon,
      rightIcon,
      containerClassName,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const fieldId = id || props.name;

    return (
      <div className={cn('space-y-1.5', containerClassName)}>
        {/* Label */}
        {label && (
          <label
            htmlFor={fieldId}
            className="block text-sm font-medium text-text-primary"
          >
            {label}
            {required && <span className="text-error ml-1">*</span>}
          </label>
        )}

        {/* Input with icons */}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
              {leftIcon}
            </div>
          )}

          <Input
            ref={ref}
            id={fieldId}
            error={!!error}
            className={cn(
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
              {rightIcon}
            </div>
          )}
        </div>

        {/* Error or Hint */}
        {error ? (
          <p className="text-sm text-error">{error}</p>
        ) : hint ? (
          <p className="text-sm text-text-muted">{hint}</p>
        ) : null}
      </div>
    );
  }
);

FormField.displayName = 'FormField';
