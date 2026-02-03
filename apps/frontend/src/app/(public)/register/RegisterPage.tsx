/**
 * Register Page
 */

import { RegisterForm } from '@/components/organisms/auth';
import { PageTransition } from '@/components/atoms';

export function RegisterPage() {
  return (
    <PageTransition>
      <RegisterForm />
    </PageTransition>
  );
}
