/**
 * Network Context
 * Tracks online/offline status using Capacitor Network plugin
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { Network, type ConnectionStatus } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';

interface NetworkContextType {
  isOnline: boolean;
  connectionType: string;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

interface NetworkProviderProps {
  children: ReactNode;
}

export function NetworkProvider({ children }: NetworkProviderProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [connectionType, setConnectionType] = useState<string>('unknown');

  const updateNetworkStatus = useCallback((status: ConnectionStatus) => {
    setIsOnline(status.connected);
    setConnectionType(status.connectionType);
  }, []);

  useEffect(() => {
    // Get initial network status
    const initNetworkStatus = async () => {
      try {
        if (Capacitor.isNativePlatform()) {
          // Use Capacitor Network plugin for native platforms
          const status = await Network.getStatus();
          updateNetworkStatus(status);
        } else {
          // Fallback to browser APIs for web
          setIsOnline(navigator.onLine);
          setConnectionType(navigator.onLine ? 'wifi' : 'none');
        }
      } catch (error) {
        console.warn('Error getting network status:', error);
        // Fallback to browser API
        setIsOnline(navigator.onLine);
      }
    };

    initNetworkStatus();

    // Listen for network changes
    let removeListener: (() => void) | undefined;

    const setupListener = async () => {
      try {
        if (Capacitor.isNativePlatform()) {
          // Use Capacitor Network plugin listener
          const handle = await Network.addListener('networkStatusChange', updateNetworkStatus);
          removeListener = () => handle.remove();
        } else {
          // Fallback to browser events for web
          const handleOnline = () => {
            setIsOnline(true);
            setConnectionType('wifi');
          };
          const handleOffline = () => {
            setIsOnline(false);
            setConnectionType('none');
          };

          window.addEventListener('online', handleOnline);
          window.addEventListener('offline', handleOffline);

          removeListener = () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
          };
        }
      } catch (error) {
        console.warn('Error setting up network listener:', error);
      }
    };

    setupListener();

    return () => {
      if (removeListener) {
        removeListener();
      }
    };
  }, [updateNetworkStatus]);

  return (
    <NetworkContext.Provider value={{ isOnline, connectionType }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}
