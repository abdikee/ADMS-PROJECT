import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from './utils.js';

export function AlertDialog({ open, onOpenChange, children }) {
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
        if (child.type === AlertDialogTrigger) {
          return React.cloneElement(child, { onOpenChange });
        }
        if (child.type === AlertDialogContent) {
          return open ? React.cloneElement(child, { onOpenChange }) : null;
        }
        return child;
      })}
    </>
  );
}

export function AlertDialogTrigger({ asChild, children, onOpenChange }) {
  const handleClick = () => onOpenChange?.(true);
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, { onClick: handleClick });
  }
  return <button onClick={handleClick}>{children}</button>;
}

export function AlertDialogContent({ className, children, onOpenChange }) {
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" />
      <div
        className={cn(
          'relative z-50 grid w-full max-w-lg gap-4 rounded-lg border bg-background p-6 shadow-lg',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {React.Children.map(children, (child) => {
          if (!child) return null;
          if (child.type === AlertDialogAction || child.type === AlertDialogCancel) {
            return React.cloneElement(child, { onOpenChange });
          }
          if (child.type === AlertDialogFooter) {
            return React.cloneElement(child, { onOpenChange });
          }
          return child;
        })}
      </div>
    </div>,
    document.body
  );
}

export function AlertDialogHeader({ className, ...props }) {
  return (
    <div className={cn('flex flex-col space-y-2 text-center sm:text-left', className)} {...props} />
  );
}

export function AlertDialogFooter({ className, children, onOpenChange }) {
  return (
    <div
      className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
    >
      {React.Children.map(children, (child) => {
        if (!child) return null;
        if (child.type === AlertDialogAction || child.type === AlertDialogCancel) {
          return React.cloneElement(child, { onOpenChange });
        }
        return child;
      })}
    </div>
  );
}

export function AlertDialogTitle({ className, ...props }) {
  return (
    <h2 className={cn('text-lg font-semibold', className)} {...props} />
  );
}

export function AlertDialogDescription({ className, ...props }) {
  return (
    <p className={cn('text-sm text-muted-foreground', className)} {...props} />
  );
}

export function AlertDialogAction({ className, children, onClick, onOpenChange, ...props }) {
  const handleClick = (e) => {
    onClick?.(e);
    onOpenChange?.(false);
  };
  return (
    <button
      className={cn(
        'inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
}

export function AlertDialogCancel({ className, children, onClick, onOpenChange, ...props }) {
  const handleClick = (e) => {
    onClick?.(e);
    onOpenChange?.(false);
  };
  return (
    <button
      className={cn(
        'inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 mt-2 sm:mt-0',
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
}
