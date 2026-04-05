import React, { createContext, useContext } from 'react';
import { cn } from './utils.js';

const SelectContext = createContext(null);

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
  return null;
}

export function SelectTrigger({ className, id, children }) {
  return null;
}

export function SelectLabel({ className, children }) {
  return <optgroup label={children} className={className} />;
}

/**
 * SelectContent renders the actual <select> element.
 * When value is empty/falsy, a hidden placeholder option is injected so the
 * native <select> does NOT auto-select the first real option.
 */
export function SelectContent({ className, children }) {
  const ctx = useContext(SelectContext);

  // Collect placeholder text from SelectValue child if present
  let placeholderText = '— Select —';
  const collectPlaceholder = (nodes) => {
    React.Children.forEach(nodes, (child) => {
      if (!child) return;
      if (child.type === SelectValue && child.props.placeholder) {
        placeholderText = child.props.placeholder;
      }
    });
  };

  const options = [];
  const collectOptions = (nodes) => {
    React.Children.forEach(nodes, (child) => {
      if (!child) return;
      if (child.type === SelectItem) {
        options.push({
          value: child.props.value,
          label: child.props.children,
          disabled: child.props.disabled,
        });
      } else if (child.props?.children) {
        collectOptions(child.props.children);
      }
    });
  };

  collectPlaceholder(children);
  collectOptions(children);

  const currentValue = ctx?.value ?? ctx?.defaultValue ?? '';
  const isEmpty = currentValue === '' || currentValue === null || currentValue === undefined;

  return (
    <select
      className={cn(
        'flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      value={currentValue}
      disabled={ctx?.disabled}
      onChange={(e) => ctx?.onValueChange?.(e.target.value)}
    >
      {/* Always render a hidden placeholder option when value is empty so the
          native select doesn't silently auto-select the first real option */}
      {isEmpty && (
        <option value="" disabled hidden>
          {placeholderText}
        </option>
      )}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} disabled={opt.disabled}>
          {typeof opt.label === 'string' ? opt.label : opt.value}
        </option>
      ))}
    </select>
  );
}

export function SelectItem({ value, children, disabled, className }) {
  return null;
}

export function SelectSeparator({ className }) {
  return null;
}
