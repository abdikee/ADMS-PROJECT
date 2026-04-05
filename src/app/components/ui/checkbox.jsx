import React from 'react';
import { cn } from './utils.js';

export function Checkbox({ className, checked, onCheckedChange, disabled, id, ...props }) {
  return (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      disabled={disabled}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      className={cn(
        'h-4 w-4 shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 accent-primary',
        className
      )}
      {...props}
    />
  );
}
