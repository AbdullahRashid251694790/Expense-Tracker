/**
 * useKeyboard Hook
 * Detect keyboard visibility and height on Capacitor native platforms
 */

import { useState, useEffect } from 'react';
import { Keyboard } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';

interface UseKeyboardReturn {
  keyboardHeight: number;
  isKeyboardVisible: boolean;
}

export function useKeyboard(): UseKeyboardReturn {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    // Only run on native platforms (iOS/Android)
    if (!Capacitor.isNativePlatform()) return;

    const showListener = Keyboard.addListener('keyboardWillShow', (info) => {
      setKeyboardHeight(info.keyboardHeight);
      setIsKeyboardVisible(true);
    });

    const hideListener = Keyboard.addListener('keyboardWillHide', () => {
      setKeyboardHeight(0);
      setIsKeyboardVisible(false);
    });

    return () => {
      showListener.then((h) => h.remove());
      hideListener.then((h) => h.remove());
    };
  }, []);

  return { keyboardHeight, isKeyboardVisible };
}
