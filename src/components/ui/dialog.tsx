import * as React from 'react';
import { cn } from '@/lib/utils';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export function Dialog({ open, onClose, children, className }: DialogProps) {
  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
          onClick={onClose}
          aria-hidden="true"
        />
        
        <div
          className={cn(
            "relative transform overflow-hidden rounded-lg bg-white",
            "p-6 text-left shadow-xl",
            "w-full max-w-md",
            "animate-zoom-in",
            className
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

interface DialogHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function DialogHeader({ children, className }: DialogHeaderProps) {
  return (
    <div className={cn("mb-4", className)}>
      {children}
    </div>
  );
}

interface DialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function DialogTitle({ children, className }: DialogTitleProps) {
  return (
    <h3 
      className={cn(
        "text-lg font-semibold text-gray-900",
        "leading-6",
        className
      )}
      id="modal-title"
    >
      {children}
    </h3>
  );
}

interface DialogDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function DialogDescription({ children, className }: DialogDescriptionProps) {
  return (
    <p className={cn("mt-2 text-sm text-gray-500 leading-relaxed", className)}>
      {children}
    </p>
  );
}

interface DialogFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function DialogFooter({ children, className }: DialogFooterProps) {
  return (
    <div className={cn("mt-6 flex justify-end space-x-3", className)}>
      {children}
    </div>
  );
}