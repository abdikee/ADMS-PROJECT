import React, { useState } from 'react';
import { cn } from './utils.js';

export function Avatar({ className, ...props }) {
  return (
    <span
      className={cn(
        'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',
        className
      )}
      {...props}
    />
  );
}

export function AvatarImage({ src, alt, className, onError, ...props }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) return null;

  return (
    <img
      src={src}
      alt={alt || ''}
      className={cn('aspect-square h-full w-full object-cover', className)}
      onError={() => setFailed(true)}
      {...props}
    />
  );
}

export function AvatarFallback({ className, ...props }) {
  return (
    <span
      className={cn(
        'flex h-full w-full items-center justify-center rounded-full bg-muted',
        className
      )}
      {...props}
    />
  );
}
