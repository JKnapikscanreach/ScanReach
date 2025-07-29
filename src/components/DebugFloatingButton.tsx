import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MasterDebugModal } from './MasterDebugModal';
import { useDebug } from '@/contexts/DebugContext';
import { useDebugKeyboard } from '@/hooks/useDebugKeyboard';
import { Bug, BugOff } from 'lucide-react';

export const DebugFloatingButton: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const { isEnabled, toggleDebug, entries } = useDebug();

  // Add keyboard shortcuts
  useDebugKeyboard(() => setModalOpen(true));

  const errorCount = entries.filter(entry => entry.type === 'error' || entry.error).length;

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        <Button
          variant={isEnabled ? "default" : "outline"}
          size="sm"
          onClick={toggleDebug}
          className="relative"
        >
          {isEnabled ? <Bug className="h-4 w-4" /> : <BugOff className="h-4 w-4" />}
          {isEnabled && errorCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {errorCount > 99 ? '99+' : errorCount}
            </Badge>
          )}
        </Button>
        
        {isEnabled && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setModalOpen(true)}
            className="relative"
            title="Open Master Debug Console (Ctrl+Shift+D)"
          >
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
        )}
      </div>

      <MasterDebugModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
};