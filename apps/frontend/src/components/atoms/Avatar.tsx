import { type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/**
 * Avatar Component
 * User profile image or initials
 */

const avatarVariants = cva(
  [
    'inline-flex items-center justify-center',
    'rounded-full bg-casha-primary/10 text-casha-primary',
    'font-medium overflow-hidden',
  ],
  {
    variants: {
      size: {
        sm: 'h-8 w-8 text-xs',
        md: 'h-10 w-10 text-sm',
        lg: 'h-12 w-12 text-base',
        xl: 'h-16 w-16 text-lg',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export interface AvatarProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  src?: string;
  alt?: string;
  name?: string;
  fallback?: React.ReactNode;
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function Avatar({
  src,
  alt,
  name,
  size,
  fallback,
  className,
  ...props
}: AvatarProps) {
  const initials = name ? getInitials(name) : null;

  return (
    <div
      className={cn(avatarVariants({ size }), className)}
      {...props}
    >
      {src ? (
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          className="h-full w-full object-cover"
        />
      ) : initials ? (
        <span>{initials}</span>
      ) : fallback ? (
        fallback
      ) : (
        <User className="h-1/2 w-1/2" />
      )}
    </div>
  );
}
