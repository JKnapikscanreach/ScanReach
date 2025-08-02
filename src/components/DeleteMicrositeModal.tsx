import { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMicrosites } from '@/hooks/useMicrosites';
import { toast } from 'sonner';

interface DeleteMicrositeModalProps {
  micrositeId: string;
  micrositeName: string;
  trigger?: React.ReactNode;
  onDelete?: () => void;
}

export function DeleteMicrositeModal({ 
  micrositeId, 
  micrositeName, 
  trigger,
  onDelete 
}: DeleteMicrositeModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { deleteMicrosite } = useMicrosites();

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') {
      toast.error('Please type "DELETE" to confirm');
      return;
    }

    try {
      setIsDeleting(true);
      await deleteMicrosite(micrositeId);
      toast.success('Microsite deleted successfully');
      setIsOpen(false);
      onDelete?.();
    } catch (error) {
      console.error('Error deleting microsite:', error);
      toast.error('Failed to delete microsite');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setConfirmText('');
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Microsite
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Are you sure you want to delete <strong>"{micrositeName}"</strong>?
            </p>
            <p className="text-sm">
              This action will permanently delete:
            </p>
            <ul className="text-sm list-disc list-inside space-y-1 pl-4">
              <li>The microsite and all its content</li>
              <li>All associated cards and buttons</li>
              <li>Scan history and analytics</li>
              <li>QR codes and custom themes</li>
            </ul>
            <p className="text-sm font-medium text-destructive">
              This action cannot be undone.
            </p>
            
            <div className="space-y-2 pt-2">
              <Label htmlFor="confirm-delete" className="text-sm font-medium">
                Type <strong>DELETE</strong> to confirm:
              </Label>
              <Input
                id="confirm-delete"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type DELETE here"
                className="font-mono"
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={confirmText !== 'DELETE' || isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Deleting...' : 'Delete Microsite'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}