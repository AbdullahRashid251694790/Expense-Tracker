/**
 * Forgot Password Page
 */

import { ForgotPasswordForm } from '@/components/organisms/auth';
import { PageTransition } from '@/components/atoms';

export function ForgotPasswordPage() {
  return (
    <PageTransition>
      <ForgotPasswordForm />
    </PageTransition>
  );
}
