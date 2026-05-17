import React from 'react';
import { AlertCircle, Check, X } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

const BugsModal = ({ isOpen, onClose, bugs, loading, onToggleStatus, actionLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-96 overflow-y-auto">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Bug Reports</h3>
        
        {loading ? (
          <div className="py-8">
            <LoadingSpinner />
          </div>
        ) : bugs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No bug reports found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bugs.map((bug) => (
              <div key={bug.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{bug.restaurant || 'Unknown Restaurant'}</div>
                  <div className="text-sm text-gray-600">{bug.issue}</div>
                  <div className="text-xs text-gray-500">{bug.date}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    bug.status === 'resolved' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {bug.status}
                  </span>
                  <button
                    onClick={() => onToggleStatus(bug.id)}
                    disabled={actionLoading[`bug-${bug.id}`]}
                    className={`p-1 rounded transition-colors disabled:opacity-50 ${
                      bug.status === 'resolved'
                        ? 'text-orange-600 hover:bg-orange-100'
                        : 'text-green-600 hover:bg-green-100'
                    }`}
                  >
                    {actionLoading[`bug-${bug.id}`] ? (
                      <LoadingSpinner size="small" />
                    ) : bug.status === 'resolved' ? (
                      <X className="h-4 w-4" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default BugsModal;
