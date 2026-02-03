/**
 * Reset Password Page
 */

import { ResetPasswordForm } from '@/components/organisms/auth';
import { PageTransition } from '@/components/atoms';

export function ResetPasswordPage() {
  return (
    <PageTransition>
      <ResetPasswordForm />
    </PageTransition>
  );
}
