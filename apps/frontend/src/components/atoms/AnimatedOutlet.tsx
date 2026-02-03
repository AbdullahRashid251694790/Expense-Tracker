/**
 * AnimatedOutlet Component
 * Wraps React Router Outlet with AnimatePresence for page transitions
 */

import { cloneElement } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useOutlet, useLocation } from 'react-router-dom';

interface AnimatedOutletProps {
  context?: unknown;
}

export function AnimatedOutlet({ context }: AnimatedOutletProps) {
  const location = useLocation();
  const element = useOutlet(context);

  return (
    <AnimatePresence mode="wait">
      {element && cloneElement(element, { key: location.pathname })}
    </AnimatePresence>
  );
}
