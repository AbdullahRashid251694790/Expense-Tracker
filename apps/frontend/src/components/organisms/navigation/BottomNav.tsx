/**
 * BottomNav Component
 * Mobile-only bottom navigation bar with futuristic design
 */

import { useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Receipt, Target, TrendingUp, MessageSquare } from 'lucide-react';
import { useKeyboard } from '@/lib/hooks/useKeyboard';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/expenses', icon: Receipt, label: 'Expenses' },
  { to: '/budgets', icon: Target, label: 'Budgets' },
  { to: '/insights', icon: TrendingUp, label: 'Insights' },
  { to: '/chat', icon: MessageSquare, label: 'Chat' },
];

export function BottomNav() {
  const location = useLocation();
  const activeIndex = navItems.findIndex((item) => location.pathname.startsWith(item.to));
  const { isKeyboardVisible } = useKeyboard();

  return (
    <AnimatePresence>
      {!isKeyboardVisible && (
        <motion.nav
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-40 lg:hidden pb-safe-bottom"
        >
          <div className="relative flex items-center justify-center gap-4 bg-white/20 dark:bg-black/20 backdrop-blur-2xl mx-4 mb-2 rounded-full px-4 py-3 shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">

        {/* Active Indicator Glow */}
        {activeIndex >= 0 && (
          <motion.div
            layoutId="active-indicator"
            className="absolute w-14 h-14 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur-2xl opacity-60 -z-10"
            animate={{
              left: `calc(${activeIndex * (100 / navItems.length)}% + ${100 / navItems.length / 2}%)`,
              translateX: '-50%',
            }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        )}

        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeIndex === index;

          return (
            <motion.div key={item.to} className="relative flex flex-col items-center group">
              {/* Button */}
              <Link to={item.to}>
                <motion.div
                  whileHover={{ scale: 1.2 }}
                  animate={{ scale: isActive ? 1.3 : 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className={`flex items-center justify-center w-12 h-12 rounded-full relative z-10 ${
                    isActive
                      ? 'text-blue-500 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400'
                  }`}
                >
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                </motion.div>
              </Link>

              {/* Tooltip */}
              <span className="absolute bottom-full mb-2 px-2 py-1 text-xs rounded-md bg-gray-800 text-white dark:bg-gray-200 dark:text-black opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {item.label}
              </span>
            </motion.div>
          );
        })}
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
