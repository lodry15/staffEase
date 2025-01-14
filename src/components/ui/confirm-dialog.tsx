import { Dialog, DialogHeader, DialogTitle, DialogFooter } from './dialog';
import { Button } from './button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose}>
      <div className="p-6">
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
          </div>
        </div>
        
        <DialogHeader>
          <DialogTitle className="text-center">{title}</DialogTitle>
          <p className="mt-2 text-sm text-center text-gray-500">
            {message}
          </p>
        </DialogHeader>
        
        <DialogFooter className="flex justify-center space-x-4 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className={isDestructive ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            {loading ? 'Processing...' : confirmText}
          </Button>
        </DialogFooter>
      </div>
    </Dialog>
  );
}