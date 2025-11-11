
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

// Fix: The Card component was a standard functional component which cannot receive a ref.
// It has been wrapped in React.forwardRef to allow passing a ref from its parent,
// which is necessary for the scrolling behavior in the StudentDashboard.
const Card = React.forwardRef<HTMLDivElement, CardProps>(({ children, className = '' }, ref) => {
  return (
    <div ref={ref} className={`bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      {children}
    </div>
  );
});

export default Card;
