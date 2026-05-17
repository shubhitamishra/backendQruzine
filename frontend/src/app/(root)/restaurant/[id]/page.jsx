"use client";
import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  ShoppingBag, 
  ChefHat, 
  QrCode, 
  Bell,
  Settings
} from 'lucide-react';
import OverviewComponent from '../../../../components/dashboard/OverviewComponent';
import OrdersComponent from '../../../../components/dashboard/OrdersComponent';
import MenuComponent from '../../../../components/dashboard/MenuComponent';
import QRCodesComponent from '../../../../components/dashboard/QRCodesComponent';
import apiService from '../../../../lib/api';

const RestaurantDashboard = ({ params }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [resID, setResID] = useState(null);
  const [restaurantInfo, setRestaurantInfo] = useState(null);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Extract resID from URL params
    if (params?.id) {
      setResID(params.id);
    }
  }, [params]);

  useEffect(() => {
    if (resID) {
      // Set up authentication token from localStorage
      const token = localStorage.getItem('authToken');
      if (token) {
        apiService.setToken(token);
      } else {
        // Redirect to login if no token found
        window.location.href = '/login';
        return;
      }

      fetchRestaurantInfo();
      fetchPendingOrders();
    }
  }, [resID]);

  const fetchRestaurantInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to fetch actual restaurant info from backend
      const response = await apiService.getDashboardStats(resID);
      setRestaurantInfo({
        name: response.data.restaurant?.name || `Restaurant ${resID}`,
        resID: resID
      });
    } catch (err) {
      console.error('Error fetching restaurant info:', err);
      if (err.message === 'Authentication required') {
        // Already handled by API service - user will be redirected
        return;
      }
      setError('Failed to load restaurant information');
      // Fallback for demo
      setRestaurantInfo({
        name: `Restaurant ${resID}`,
        resID: resID
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingOrders = async () => {
    try {
      const response = await apiService.getDashboardStats(resID);
      setPendingOrdersCount(response.data.orders.active || 0);
    } catch (err) {
      console.error('Error fetching pending orders:', err);
    }
  };

  const renderTabContent = () => {
    if (!resID) return <div>Loading...</div>;
    
    switch (activeTab) {
      case 'overview':
        return <OverviewComponent resID={resID} />;
      case 'orders':
        return <OrdersComponent resID={resID} />;
      case 'menu':
        return <MenuComponent resID={resID} />;
      case 'qr':
        return <QRCodesComponent resID={resID} />;
      default:
        return <OverviewComponent resID={resID} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading restaurant dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Restaurant Dashboard</h1>
              <p className="text-sm text-gray-600">ID: {resID}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Bell className="h-6 w-6 text-gray-600" />
                {pendingOrdersCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">
                    {pendingOrdersCount}
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-600">
                Welcome, {restaurantInfo?.name || 'Restaurant Admin'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'orders', label: 'Orders', icon: ShoppingBag },
              { id: 'menu', label: 'Menu', icon: ChefHat },
              { id: 'qr', label: 'QR Codes', icon: QrCode }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default RestaurantDashboard;
