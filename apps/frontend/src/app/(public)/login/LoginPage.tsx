/**
 * Login Page
 */

import { LoginForm } from '@/components/organisms/auth';
import { PageTransition } from '@/components/atoms';

export function LoginPage() {
  return (
    <PageTransition>
      <LoginForm />
    </PageTransition>
  );
}
