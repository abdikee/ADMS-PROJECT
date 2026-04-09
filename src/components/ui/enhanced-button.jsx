import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn.js';

const buttonVariants = {
  default: 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500',
  secondary: 'bg-secondary-100 text-secondary-900 hover:bg-secondary-200 focus:ring-secondary-500',
  success: 'bg-success-500 text-white hover:bg-success-600 focus:ring-success-500',
  warning: 'bg-warning-500 text-white hover:bg-warning-600 focus:ring-warning-500',
  error: 'bg-error-500 text-white hover:bg-error-600 focus:ring-error-500',
  outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-primary-500',
  ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
  link: 'text-primary-600 underline-offset-4 hover:underline focus:ring-primary-500'
};

const sizeVariants = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
  xl: 'px-8 py-4 text-lg'
};

export function EnhancedButton({
  children,
  variant = 'default',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  onClick,
  type = 'button',
  ...props
}) {
  const baseClasses = cn(
    'inline-flex items-center justify-center',
    'rounded-lg font-medium transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'active:scale-95',
    buttonVariants[variant],
    sizeVariants[size],
    className
  );

  const content = (
    <>
      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {!loading && Icon && iconPosition === 'left' && <Icon className="w-4 h-4 mr-2" />}
      {children}
      {!loading && Icon && iconPosition === 'right' && <Icon className="w-4 h-4 ml-2" />}
    </>
  );

  return (
    <motion.button
      type={type}
      className={baseClasses}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.1 }}
      {...props}
    >
      {content}
    </motion.button>
  );
}

// Floating Action Button
export function FloatingActionButton({
  children,
  icon: Icon,
  position = 'bottom-right',
  color = 'primary',
  className = '',
  onClick,
  ...props
}) {
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  };

  const colorClasses = {
    primary: 'bg-primary-500 hover:bg-primary-600 text-white shadow-primary',
    success: 'bg-success-500 hover:bg-success-600 text-white shadow-success',
    warning: 'bg-warning-500 hover:bg-warning-600 text-white shadow-warning',
    error: 'bg-error-500 hover:bg-error-600 text-white shadow-error'
  };

  return (
    <motion.button
      className={cn(
        'fixed w-14 h-14 rounded-full shadow-lg',
        'flex items-center justify-center',
        'hover:scale-110 active:scale-95',
        'transition-all duration-200',
        'z-50',
        positionClasses[position],
        colorClasses[color],
        className
      )}
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      {...props}
    >
      {Icon ? <Icon className="w-6 h-6" /> : children}
    </motion.button>
  );
}

// Icon Button
export function IconButton({
  icon: Icon,
  variant = 'ghost',
  size = 'md',
  tooltip,
  className = '',
  onClick,
  ...props
}) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  return (
    <motion.button
      className={cn(
        'inline-flex items-center justify-center rounded-lg',
        'transition-all duration-200',
        'hover:bg-gray-100 active:scale-95',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
        sizeClasses[size],
        className
      )}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title={tooltip}
      {...props}
    >
      <Icon className="w-5 h-5" />
    </motion.button>
  );
}

// Gradient Button
export function GradientButton({
  children,
  gradient = 'primary',
  size = 'md',
  className = '',
  onClick,
  ...props
}) {
  const gradientClasses = {
    primary: 'gradient-primary',
    success: 'gradient-success',
    warning: 'gradient-warning',
    error: 'gradient-error'
  };

  return (
    <motion.button
      className={cn(
        'px-6 py-3 rounded-lg text-white font-semibold',
        'shadow-lg hover:shadow-xl',
        'transition-all duration-200',
        'active:scale-95',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
        gradientClasses[gradient],
        sizeVariants[size],
        className
      )}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}
