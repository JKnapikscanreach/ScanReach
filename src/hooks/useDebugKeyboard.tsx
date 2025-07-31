import { useEffect } from 'react';
import { useDebug } from '@/contexts/DebugContext';

export const useDebugKeyboard = (onOpenModal: () => void) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Shift+D to open debug modal
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        onOpenModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenModal]);
};