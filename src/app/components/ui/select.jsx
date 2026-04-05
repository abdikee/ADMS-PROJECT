import React, { createContext, useContext } from 'react';
import { cn } from './utils.js';

// Context to pass value/onValueChange down through the compound components
const SelectContext = createContext(null);

/**
 * Select - wraps a native <select> with the Radix-compatible API:
 *   value, onValueChange, defaultValue, disabled, children
 *
 * The compound sub-components (SelectTrigger, SelectContent, SelectItem, etc.)
 * are kept for API compatibility but the actual rendering is a styled <select>.
 */
export function Select({ value, onValueChange, defaultValue, disabled, children }) {
  return (
    <SelectContext.Provider value={{ value, onValueChange, defaultValue, disabled }}>
      {children}
    </SelectContext.Provider>
  );
}

export function SelectGroup({ children }) {
  return <>{children}</>;
}

export function SelectValue({ placeholder }) {
  // Rendered inside SelectTrigger; the placeholder is forwarded there
  return null;
}

/**
 * SelectTrigger + SelectContent + SelectItem together render a single <select>.
 * We collect items from SelectContent's children and build <option> elements.
 */
export function SelectTrigger({ className, id, children }) {
  // Trigger is just a visual wrapper; the real <select> is rendered by SelectContent
  return null;
}

export function SelectLabel({ className, children }) {
  return <optgroup label={children} className={className} />;
}

/**
 * SelectContent renders the actual <select> element.
 * It walks its children to find SelectItem nodes and builds <option> elements.
 */
export function SelectContent({ className, children }) {
  const ctx = useContext(SelectContext);

  const options = [];
  const collectOptions = (nodes) => {
    React.Children.forEach(nodes, (child) => {
      if (!child) return;
      if (child.type === SelectItem) {
        options.push({ value: child.props.value, label: child.props.children, disabled: child.props.disabled });
      } else if (child.type === SelectGroup || child.props?.children) {
        collectOptions(child.props.children);
      }
    });
  };
  collectOptions(children);

  return (
    <select
      className={cn(
        'flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      value={ctx?.value ?? ctx?.defaultValue ?? ''}
      disabled={ctx?.disabled}
      onChange={(e) => ctx?.onValueChange?.(e.target.value)}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} disabled={opt.disabled}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export function SelectItem({ value, children, disabled, className }) {
  // Rendered as <option> inside SelectContent; this component itself is never mounted
  return null;
}

export function SelectSeparator({ className }) {
  return null;
}
