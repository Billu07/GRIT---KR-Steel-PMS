import React from 'react';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
}

const Card: React.FC<CardProps> = ({ children, title, className, ...props }) => {
  return (
    <div 
      className={twMerge(
        'bg-white rounded-sm border border-gray-200 shadow-sm p-6 transition-shadow duration-200 hover:shadow-md', 
        className
      )}
      {...props}
    >
      {title && (
        <div className="mb-4 pb-2 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tight">{title}</h3>
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;
