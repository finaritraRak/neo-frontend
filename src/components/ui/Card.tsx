import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  padding = 'md',
  hover = false
}) => {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  return (
    <div className={`
      bg-white dark:bg-gray-800 
      rounded-xl shadow-sm border border-gray-200 dark:border-gray-700
      ${paddingClasses[padding]}
      ${hover ? 'hover:shadow-md transition-shadow duration-200 dark:hover:bg-gray-700' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
};