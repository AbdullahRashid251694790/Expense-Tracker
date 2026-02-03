import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from '@/lib/context/AuthContext';
import { ThemeProvider } from '@/lib/context/ThemeContext';
import { NetworkProvider } from '@/lib/context/NetworkContext';
import { CurrencyProvider } from '@/lib/context/CurrencyContext';
import { OfflineToast } from '@/components/atoms/OfflineToast';

// Layouts
import { AuthLayout } from '@/components/templates/AuthLayout';
import { AppShell } from '@/components/templates/AppShell';
import { ProtectedRoute } from '@/components/templates/ProtectedRoute';

// Public Pages
import { LoginPage } from '@/app/(public)/login/LoginPage';
import { RegisterPage } from '@/app/(public)/register/RegisterPage';
import { ForgotPasswordPage } from '@/app/(public)/forgot-password/ForgotPasswordPage';
import { ResetPasswordPage } from '@/app/(public)/reset-password/ResetPasswordPage';

// Authenticated Pages
import { DashboardPage } from '@/app/(authenticated)/dashboard/DashboardPage';
import { ExpensesPage } from '@/app/(authenticated)/expenses/ExpensesPage';
import { BudgetsPage } from '@/app/(authenticated)/budgets/BudgetsPage';
import { InsightsPage } from '@/app/(authenticated)/insights/InsightsPage';
import { SettingsPage } from '@/app/(authenticated)/settings/SettingsPage';
import { ChatPage } from '@/app/(authenticated)/chat/ChatPage';
import { SubscriptionsPage } from '@/app/(authenticated)/subscriptions/SubscriptionsPage';
import { OnboardingPage } from '@/app/(authenticated)/onboarding/OnboardingPage';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* Onboarding Route (Protected, no AppShell) */}
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/expenses" element={<ExpensesPage />} />
          <Route path="/budgets" element={<BudgetsPage />} />
          <Route path="/insights" element={<InsightsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/subscriptions" element={<SubscriptionsPage />} />
        </Route>

        {/* Default Redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <ThemeProvider>
      <NetworkProvider>
        <AuthProvider>
          <CurrencyProvider>
            <AnimatedRoutes />
            <OfflineToast />
          </CurrencyProvider>
        </AuthProvider>
      </NetworkProvider>
    </ThemeProvider>
  );
}

export default App;
