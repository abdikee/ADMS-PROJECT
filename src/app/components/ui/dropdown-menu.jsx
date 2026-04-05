import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from './utils.js';

export function DropdownMenu({ children }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, handleKeyDown]);

  return (
    <div ref={containerRef} className="relative inline-block">
      {React.Children.map(children, (child) => {
        if (!child) return null;
        if (child.type === DropdownMenuTrigger) {
          return React.cloneElement(child, { open, setOpen });
        }
        if (child.type === DropdownMenuContent) {
          return open ? React.cloneElement(child, { setOpen }) : null;
        }
        return child;
      })}
    </div>
  );
}

export function DropdownMenuTrigger({ asChild, children, open, setOpen }) {
  const handleClick = (e) => {
    e.stopPropagation();
    setOpen?.((prev) => !prev);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, { onClick: handleClick });
  }
  return <button type="button" onClick={handleClick}>{children}</button>;
}

export function DropdownMenuContent({ className, align = 'start', children, setOpen }) {
  const alignClass = align === 'end' ? 'right-0' : 'left-0';

  return (
    <div
      className={cn(
        'absolute top-full mt-1 z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
        alignClass,
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {React.Children.map(children, (child) => {
        if (!child) return null;
        if (child.type === DropdownMenuItem) {
          return React.cloneElement(child, { setOpen });
        }
        return child;
      })}
    </div>
  );
}

export function DropdownMenuLabel({ className, inset, ...props }) {
  return (
    <div
      className={cn(
        'px-2 py-1.5 text-sm font-semibold',
        inset && 'pl-8',
        className
      )}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({ className, ...props }) {
  return (
    <div className={cn('-mx-1 my-1 h-px bg-muted', className)} {...props} />
  );
}

export function DropdownMenuItem({ className, inset, children, onClick, setOpen, ...props }) {
  const handleClick = (e) => {
    onClick?.(e);
    setOpen?.(false);
  };

  return (
    <div
      role="menuitem"
      tabIndex={0}
      className={cn(
        'relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        inset && 'pl-8',
        className
      )}
      onClick={handleClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(e); }}
      {...props}
    >
      {children}
    </div>
  );
}

export function DropdownMenuGroup({ ...props }) {
  return <div {...props} />;
}
