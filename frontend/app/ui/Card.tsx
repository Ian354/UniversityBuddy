import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  headerActions?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ 
  children, 
  className = '',
  title,
  headerActions
}) => {
  const baseClasses = 'bg-gray-700 rounded-lg shadow-md';
  const classes = `${baseClasses} ${className}`;

  return (
    <div className={classes}>
      {(title || headerActions) && (
        <div className="px-6 py-4 border-b border-gray-600 flex justify-between items-center">
          {title && <h3 className="text-xl font-bold text-gray-100">{title}</h3>}
          {headerActions}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

export default Card;