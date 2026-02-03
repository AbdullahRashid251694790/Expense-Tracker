/**
 * Offline Toast Component
 * Shows toast notifications when network status changes
 */

import { useState, useEffect, useRef } from 'react';
import { useNetwork } from '@/lib/context/NetworkContext';
import { cn } from '@/lib/utils/cn';
import { Wifi, WifiOff } from 'lucide-react';

interface ToastState {
  show: boolean;
  type: 'offline' | 'online';
  message: string;
}

export function OfflineToast() {
  const { isOnline } = useNetwork();
  const [toast, setToast] = useState<ToastState>({
    show: false,
    type: 'offline',
    message: '',
  });
  const prevOnlineRef = useRef(isOnline);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    // Skip the first render to avoid showing toast on page load
    if (!initializedRef.current) {
      initializedRef.current = true;
      prevOnlineRef.current = isOnline;
      return;
    }

    // Only show toast when status actually changes
    if (isOnline !== prevOnlineRef.current) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (!isOnline) {
        // Going offline - show toast
        setToast({
          show: true,
          type: 'offline',
          message: "You're offline. Changes will sync when connected.",
        });
        // Auto-dismiss after 4 seconds
        timeoutRef.current = setTimeout(() => {
          setToast((prev) => ({ ...prev, show: false }));
        }, 4000);
      } else {
        // Coming back online - show success toast
        setToast({
          show: true,
          type: 'online',
          message: 'Back online!',
        });
        // Auto-dismiss after 4 seconds
        timeoutRef.current = setTimeout(() => {
          setToast((prev) => ({ ...prev, show: false }));
        }, 4000);
      }

      prevOnlineRef.current = isOnline;
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isOnline]);

  if (!toast.show) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed bottom-20 left-1/2 -translate-x-1/2 z-50',
        'flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg',
        'animate-in slide-in-from-bottom-5 fade-in duration-300',
        toast.type === 'offline'
          ? 'bg-warning text-warning-foreground'
          : 'bg-success text-success-foreground'
      )}
    >
      {toast.type === 'offline' ? (
        <WifiOff className="h-4 w-4 flex-shrink-0" />
      ) : (
        <Wifi className="h-4 w-4 flex-shrink-0" />
      )}
      <span className="text-sm font-medium">{toast.message}</span>
    </div>
  );
}
