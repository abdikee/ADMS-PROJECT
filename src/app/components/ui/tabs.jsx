import React, { createContext, useContext, useState } from 'react';
import { cn } from './utils.js';

const TabsContext = createContext(null);

export function Tabs({ defaultValue, value: controlledValue, onValueChange, className, children }) {
  const [internalValue, setInternalValue] = useState(defaultValue || '');
  const activeTab = controlledValue !== undefined ? controlledValue : internalValue;

  const handleChange = (val) => {
    if (controlledValue === undefined) {
      setInternalValue(val);
    }
    onValueChange?.(val);
  };

  return (
    <TabsContext.Provider value={{ activeTab, handleChange }}>
      <div className={cn('', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, ...props }) {
  return (
    <div
      className={cn(
        'inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground',
        className
      )}
      {...props}
    />
  );
}

export function TabsTrigger({ value, className, ...props }) {
  const ctx = useContext(TabsContext);
  const isActive = ctx?.activeTab === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={() => ctx?.handleChange(value)}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        isActive
          ? 'bg-background text-foreground shadow'
          : 'hover:bg-background/50 hover:text-foreground',
        className
      )}
      {...props}
    />
  );
}

export function TabsContent({ value, className, ...props }) {
  const ctx = useContext(TabsContext);
  if (ctx?.activeTab !== value) return null;

  return (
    <div
      role="tabpanel"
      className={cn(
        'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className
      )}
      {...props}
    />
  );
}
