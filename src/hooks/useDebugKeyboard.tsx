import { useEffect } from 'react';
import { useDebug } from '@/contexts/DebugContext';

export const useDebugKeyboard = (onOpenModal: () => void) => {
  const { toggleDebug } = useDebug();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Shift+D to open debug modal
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        onOpenModal();
      }
      
      // Ctrl+Shift+B to toggle debug mode
      if (event.ctrlKey && event.shiftKey && event.key === 'B') {
        event.preventDefault();
        toggleDebug();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenModal, toggleDebug]);
};