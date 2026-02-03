/**
 * Sidebar Organism
 * Desktop-only navigation sidebar (mobile uses BottomNav)
 */

import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  PiggyBank,
  Lightbulb,
  MessageSquare,
  CreditCard,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Expenses', href: '/expenses', icon: Receipt },
  { label: 'Budgets', href: '/budgets', icon: PiggyBank },
  { label: 'Subscriptions', href: '/subscriptions', icon: CreditCard },
  { label: 'Insights', href: '/insights', icon: Lightbulb },
  { label: 'Chat', href: '/chat', icon: MessageSquare },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-50 h-screen bg-surface border-r border-border',
        'transition-all duration-300 ease-in-out',
        'hidden lg:block',
        collapsed ? 'lg:w-[72px]' : 'lg:w-[240px]'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-border">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Casha" className="h-8 w-8 flex-shrink-0" />
          {!collapsed && (
            <span className="text-xl font-bold text-text-primary">
              Casha
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;

          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-bento-sm',
                'transition-colors duration-200',
                'hover:bg-surface-hover',
                isActive
                  ? 'bg-casha-primary/10 text-casha-primary'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && (
                <span className="font-medium">{item.label}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className={cn(
          'absolute -right-3 top-20',
          'h-6 w-6 rounded-full bg-surface border border-border',
          'flex items-center justify-center',
          'text-text-muted hover:text-text-primary hover:bg-surface-hover',
          'transition-colors duration-200',
          'shadow-sm'
        )}
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>
    </aside>
  );
}
