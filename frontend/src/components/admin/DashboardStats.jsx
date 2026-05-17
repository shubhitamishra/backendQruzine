import React from 'react';
import { Store, Users, AlertCircle } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

const DashboardStats = ({ stats, loading, error, onRetry }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {Array(2).fill(0).map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-md p-6">
            <LoadingSpinner />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-8">
        <ErrorMessage message={error} onRetry={onRetry} />
      </div>
    );
  }

  const dashboardStats = {
    totalRestaurants: stats?.restaurants?.total || 0,
    activeRestaurants: stats?.restaurants?.active || 0
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center">
          <Store className="h-8 w-8 text-blue-500" />
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Total Restaurants</p>
            <p className="text-2xl font-bold text-gray-900">{dashboardStats.totalRestaurants}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center">
          <Users className="h-8 w-8 text-green-500" />
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Active Restaurants</p>
            <p className="text-2xl font-bold text-gray-900">{dashboardStats.activeRestaurants}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;
