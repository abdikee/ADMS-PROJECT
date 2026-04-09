import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn.js';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  }
};

export function EnhancedCard({ 
  children, 
  className = '', 
  hover = true,
  gradient = false,
  glass = false,
  borderAccent = false,
  delay = 0,
  ...props 
}) {
  const baseClasses = cn(
    'rounded-xl border shadow-lg transition-all duration-300',
    {
      'hover:shadow-xl hover:-translate-y-1': hover,
      'gradient-primary text-white border-transparent': gradient,
      'glass': glass,
      'border-l-4 border-l-blue-500': borderAccent,
    },
    className
  );

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      transition={{ delay }}
      className={baseClasses}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={cn('p-6 pb-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = '', ...props }) {
  return (
    <div className={cn('px-6 pb-6', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div className={cn('px-6 pb-6 pt-4 border-t border-gray-100', className)} {...props}>
      {children}
    </div>
  );
}

// Stats Card Component
export function StatsCard({ 
  title, 
  value, 
  change, 
  changeType = 'positive',
  icon: Icon,
  color = 'primary',
  loading = false,
  className = '',
  ...props 
}) {
  const colorClasses = {
    primary: 'bg-blue-50 text-blue-600 border-blue-200',
    success: 'bg-green-50 text-green-600 border-green-200',
    warning: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    error: 'bg-red-50 text-red-600 border-red-200',
    accent: 'bg-purple-50 text-purple-600 border-purple-200'
  };

  const changeColorClasses = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-600'
  };

  if (loading) {
    return (
      <div className={cn('rounded-xl border border-gray-200 p-6', className)} {...props}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
    );
  }

  return (
    <EnhancedCard className={cn('hover:shadow-xl', className)} {...props}>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {change && (
              <div className={cn('flex items-center mt-2 text-sm font-medium', changeColorClasses[changeType])}>
                <span className="mr-1">
                  {changeType === 'positive' ? '+' : changeType === 'negative' ? '-' : ''}
                  {change}%
                </span>
                <span className="text-gray-500">from last month</span>
              </div>
            )}
          </div>
          <div className={cn('w-12 h-12 rounded-xl border flex items-center justify-center', colorClasses[color])}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </EnhancedCard>
  );
}

// Interactive Card Component
export function InteractiveCard({ 
  children, 
  onClick, 
  href, 
  as = 'div',
  className = '',
  ...props 
}) {
  const Component = as === 'a' ? 'a' : onClick ? 'button' : 'div';
  const linkProps = as === 'a' ? { href } : {};

  return (
    <EnhancedCard
      as={Component}
      onClick={onClick}
      className={cn(
        'cursor-pointer group',
        'hover:border-blue-300 hover:shadow-xl',
        'active:scale-95',
        className
      )}
      {...linkProps}
      {...props}
    >
      {children}
    </EnhancedCard>
  );
}
