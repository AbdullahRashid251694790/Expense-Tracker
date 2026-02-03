/**
 * ResetPasswordForm Organism
 * Form to reset password using a reset token
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

import { getApiUrl } from '@/lib/api/client';
import { BentoCard, Button } from '@/components/atoms';
import { FormField } from '@/components/molecules';

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

const API_URL = getApiUrl();

export function ResetPasswordForm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [showPassword, setShowPassword] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsValidating(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/api/auth/verify-reset-token?token=${encodeURIComponent(token)}`
        );
        const data = await response.json();
        setIsValidToken(data.valid);
      } catch (error) {
        console.error('Failed to verify token:', error);
        setIsValidToken(false);
      } finally {
        setIsValidating(false);
      }
    };

    verifyToken();
  }, [token]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reset password');
      }

      setIsSuccess(true);
      toast.success('Password reset successfully!');

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to reset password');
    }
  };

  // Loading state
  if (isValidating) {
    return (
      <BentoCard className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-casha-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">Verifying reset link...</p>
        </div>
      </BentoCard>
    );
  }

  // Invalid or missing token
  if (!token || !isValidToken) {
    return (
      <BentoCard className="p-6">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-error/10 rounded-full flex items-center justify-center mb-4">
            <XCircle className="h-6 w-6 text-error" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Invalid Reset Link</h1>
          <p className="text-text-secondary mt-2">
            This password reset link is invalid or has expired.
            Please request a new one.
          </p>
          <Link
            to="/forgot-password"
            className="inline-block mt-6"
          >
            <Button>Request New Link</Button>
          </Link>
          <div className="mt-4">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </Link>
          </div>
        </div>
      </BentoCard>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <BentoCard className="p-6">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-6 w-6 text-success" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Password Reset!</h1>
          <p className="text-text-secondary mt-2">
            Your password has been reset successfully.
            Redirecting you to login...
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-casha-primary hover:underline font-medium mt-6"
          >
            Go to login now
          </Link>
        </div>
      </BentoCard>
    );
  }

  // Reset form
  return (
    <BentoCard className="p-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Reset Password</h1>
        <p className="text-text-secondary mt-1">
          Enter your new password below
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          label="New Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Enter new password"
          leftIcon={<Lock className="h-4 w-4" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="hover:text-text-primary transition-colors"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          }
          error={errors.password?.message}
          hint="Min 8 chars, uppercase, lowercase, number & special character"
          {...register('password')}
        />

        <FormField
          label="Confirm Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Confirm new password"
          leftIcon={<Lock className="h-4 w-4" />}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button
          type="submit"
          fullWidth
          isLoading={isSubmitting}
          className="mt-6"
        >
          Reset Password
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
      </div>
    </BentoCard>
  );
}
