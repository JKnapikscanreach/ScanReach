import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MasterDebugModal } from './MasterDebugModal';
import { useDebug } from '@/contexts/DebugContext';
import { useDebugKeyboard } from '@/hooks/useDebugKeyboard';
import { Bug, BugOff } from 'lucide-react';

export const DebugFloatingButton: React.FC = () => {
  console.log('DebugFloatingButton rendering...');
  const [modalOpen, setModalOpen] = useState(false);
  const { isEnabled, toggleDebug, entries } = useDebug();
  const location = useLocation();
  
  console.log('DebugFloatingButton location:', location.pathname);

  // Don't show debug button on public microsite pages
  if (location.pathname.startsWith('/m/')) {
    console.log('Hiding debug button for microsite page');
    return null;
  }

  // Add keyboard shortcuts
  useDebugKeyboard(() => setModalOpen(true));

  const errorCount = entries.filter(entry => entry.type === 'error' || entry.error).length;

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setModalOpen(true)}
          className="relative"
          title="Open Debug Console (Ctrl+Shift+D)"
        >
          <Bug className="h-4 w-4 mr-2" />
          Debug ({entries.length})
          {errorCount > 0 && (
            <Badge 
              variant="destructive" 
              className="ml-2 h-4 px-1 text-xs"
            >
              {errorCount}
            </Badge>
          )}
        </Button>
      </div>

      <MasterDebugModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
};