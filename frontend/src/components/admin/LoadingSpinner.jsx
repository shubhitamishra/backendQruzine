import React from 'react';
import { Loader } from 'lucide-react';

const LoadingSpinner = ({ size = 'medium' }) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-6 w-6',
    large: 'h-8 w-8'
  };

  return (
    <div className="flex items-center justify-center">
      <Loader className={`${sizeClasses[size]} animate-spin text-blue-500`} />
    </div>
  );
};

export default LoadingSpinner;
