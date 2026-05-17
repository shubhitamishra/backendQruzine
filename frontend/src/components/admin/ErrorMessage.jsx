import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

const ErrorMessage = ({ message, onRetry }) => (
  <div className="flex items-center justify-center p-6 bg-red-50 rounded-lg">
    <div className="text-center">
      <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
      <p className="text-red-700 mb-3">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      )}
    </div>
  </div>
);

export default ErrorMessage;
