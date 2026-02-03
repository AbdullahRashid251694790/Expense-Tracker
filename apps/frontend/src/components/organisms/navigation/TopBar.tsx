/**
 * TopBar Organism
 * Top navigation bar with user menu and quick actions
 */

import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, LogOut, Settings, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/lib/context/AuthContext';
import { Button, Avatar } from '@/components/atoms';

interface TopBarProps {
  onQuickAdd?: () => void;
}

export function TopBar({ onQuickAdd }: TopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-surface border-b border-border pt-safe-top">
      <div className="h-16 px-4 sm:px-6 flex items-center justify-between">
      {/* Left - Mobile Logo */}
      <div className="flex items-center gap-2 lg:hidden">
        <img src="/logo.png" alt="Casha" className="h-8 w-8" />
        <span className="font-bold text-lg text-text-primary">Casha</span>
      </div>

      {/* Desktop - Empty space or breadcrumb area */}
      <div className="hidden lg:block" />

      {/* Right - Actions */}
      <div className="flex items-center gap-3">
        {/* Quick Add Button - Desktop */}
        <Button
          variant="primary"
          size="sm"
          onClick={onQuickAdd}
          leftIcon={<Plus className="h-4 w-4" />}
          className="hidden sm:inline-flex"
        >
          Add Expense
        </Button>

        {/* Quick Add Button - Mobile (icon only, touch-friendly) */}
        <Button
          variant="primary"
          size="icon-sm"
          onClick={onQuickAdd}
          className="sm:hidden !rounded-full !w-11 !h-11 !p-0"
          aria-label="Add expense"
        >
          <Plus className="h-5 w-5" />
        </Button>

        {/* User Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={cn(
              'flex items-center gap-2 p-2 rounded-bento-sm min-h-[44px]',
              'hover:bg-surface-hover transition-colors duration-200'
            )}
          >
            <Avatar name={user?.name || user?.email} size="sm" />
            <span className="text-sm font-medium text-text-primary hidden sm:block max-w-[120px] truncate">
              {user?.name || user?.email?.split('@')[0]}
            </span>
            <ChevronDown
              className={cn(
                'h-4 w-4 text-text-muted transition-transform duration-200 hidden sm:block',
                menuOpen && 'rotate-180'
              )}
            />
          </button>

          {/* Dropdown Menu */}
          {menuOpen && (
            <div
              className={cn(
                'absolute right-0 top-full mt-2 w-48',
                'bg-surface border border-border rounded-bento-sm shadow-bento-lg',
                'py-1 animate-in slide-in-up z-50'
              )}
            >
              <div className="px-3 py-2 border-b border-border">
                <p className="text-sm font-medium text-text-primary truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-text-muted truncate">
                  {user?.email}
                </p>
              </div>

              <Link
                to="/settings"
                onClick={() => setMenuOpen(false)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2.5 min-h-[44px]',
                  'text-sm text-text-secondary hover:text-text-primary',
                  'hover:bg-surface-hover transition-colors'
                )}
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>

              <button
                onClick={handleLogout}
                className={cn(
                  'flex items-center gap-2 px-3 py-2.5 w-full min-h-[44px]',
                  'text-sm text-error hover:bg-error/10',
                  'transition-colors'
                )}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
      </div>
    </header>
  );
}
