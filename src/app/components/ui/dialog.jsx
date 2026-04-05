import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from './utils.js';

export function Dialog({ open, onOpenChange, children }) {
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape' && open) {
        onOpenChange?.(false);
      }
    },
    [open, onOpenChange]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      {React.Children.map(children, (child) => {
        if (!child) return null;
        if (child.type === DialogTrigger) {
          return React.cloneElement(child, { onOpenChange });
        }
        if (child.type === DialogContent) {
          return open ? React.cloneElement(child, { onOpenChange }) : null;
        }
        return child;
      })}
    </>
  );
}

export function DialogTrigger({ asChild, children, onOpenChange }) {
  const handleClick = () => onOpenChange?.(true);
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, { onClick: handleClick });
  }
  return <button onClick={handleClick}>{children}</button>;
}

export function DialogContent({ className, children, onOpenChange }) {
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => onOpenChange?.(false)}
      />
      {/* Panel — slides up from bottom on mobile, centered on sm+ */}
      <div
        className={cn(
          'relative z-50 grid w-full gap-4 bg-background shadow-lg',
          'rounded-t-2xl sm:rounded-lg border',
          'p-4 sm:p-6',
          'max-h-[92vh] sm:max-h-[90vh] overflow-y-auto',
          'sm:w-full',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          onClick={() => onOpenChange?.(false)}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
}

export function DialogHeader({ className, ...props }) {
  return (
    <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props} />
  );
}

export function DialogFooter({ className, ...props }) {
  return (
    <div
      className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
      {...props}
    />
  );
}

export function DialogTitle({ className, ...props }) {
  return (
    <h2 className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props} />
  );
}

export function DialogDescription({ className, ...props }) {
  return (
    <p className={cn('text-sm text-muted-foreground', className)} {...props} />
  );
}

export function DialogClose({ asChild, children, onOpenChange }) {
  const handleClick = () => onOpenChange?.(false);
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, { onClick: handleClick });
  }
  return <button onClick={handleClick}>{children}</button>;
}
