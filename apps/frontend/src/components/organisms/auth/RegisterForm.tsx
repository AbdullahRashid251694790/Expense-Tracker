/**
 * RegisterForm Organism
 * Complete registration form with validation
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/lib/context/AuthContext';
import { ApiError } from '@/lib/api/client';
import { BentoCard, Button } from '@/components/atoms';
import { FormField } from '@/components/molecules';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    email: z.string().email('Invalid email address'),
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

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        name: data.name,
      });
      toast.success('Account created successfully!');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else if (error instanceof Error) {
        toast.error(error.message || 'Failed to create account');
      } else {
        toast.error('An unexpected error occurred');
      }
    }
  };

  return (
    <BentoCard className="p-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Create account</h1>
        <p className="text-text-secondary mt-1">
          Start tracking your expenses today
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          label="Name"
          type="text"
          placeholder="John Doe"
          leftIcon={<User className="h-4 w-4" />}
          error={errors.name?.message}
          {...register('name')}
        />

        <FormField
          label="Email"
          type="email"
          placeholder="you@example.com"
          required
          leftIcon={<Mail className="h-4 w-4" />}
          error={errors.email?.message}
          {...register('email')}
        />

        <FormField
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Create a password"
          required
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
          placeholder="Confirm your password"
          required
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
          Create Account
        </Button>
      </form>

      <div className="mt-6 text-center text-sm">
        <span className="text-text-secondary">Already have an account? </span>
        <Link
          to="/login"
          className="text-casha-primary hover:underline font-medium"
        >
          Sign in
        </Link>
      </div>
    </BentoCard>
  );
}
