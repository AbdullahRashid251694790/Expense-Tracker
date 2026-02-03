/**
 * AppShell Template
 * Main application layout with sidebar (desktop), bottom nav (mobile), and topbar
 */

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { Sidebar, TopBar, BottomNav } from '@/components/organisms/navigation';
import { AddExpenseModal } from '@/components/organisms/expenses/AddExpenseModal';
import { AnimatedOutlet } from '@/components/atoms';

export function AppShell() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background pl-safe-left pr-safe-right">
      {/* Top Safe Area Barrier - Fixed, covers status bar on mobile */}
      <div
        className="fixed top-0 left-0 right-0 h-safe-top bg-surface z-50 lg:hidden"
        aria-hidden="true"
      />

      {/* Bottom Safe Area Barrier - Fixed, covers home indicator on mobile */}
      <div
        className="fixed bottom-0 left-0 right-0 h-safe-bottom bg-background z-50 lg:hidden"
        aria-hidden="true"
      />

      {/* Desktop Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div
        className={cn(
          'transition-all duration-300 ease-in-out',
          // Desktop: margin based on sidebar state
          'lg:ml-[240px]',
          sidebarCollapsed && 'lg:ml-[72px]',
          // Mobile: no left margin
          'ml-0'
        )}
      >
        {/* Top Bar */}
        <TopBar onQuickAdd={() => setQuickAddOpen(true)} />

        {/* Page Content - with bottom padding for mobile nav */}
        <main className="p-4 sm:p-6 pb-32 lg:pb-6">
          <AnimatedOutlet context={{ quickAddOpen, setQuickAddOpen }} />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Quick Add Expense Modal */}
      <AddExpenseModal
        isOpen={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
      />
    </div>
  );
}

// Hook to access app shell context
export function useAppShell() {
  // This would use useOutletContext in actual usage
  return {
    quickAddOpen: false,
    setQuickAddOpen: (_open: boolean) => {},
  };
}
