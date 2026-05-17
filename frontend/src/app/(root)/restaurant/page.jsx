"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  TrendingUp, 
  ShoppingBag, 
  ChefHat, 
  QrCode, 
  Bell,
  Settings
} from 'lucide-react';
import OverviewComponent from '../../../components/dashboard/OverviewComponent';
import OrdersComponent from '../../../components/dashboard/OrdersComponent';
import MenuComponent from '../../../components/dashboard/MenuComponent';
import QRCodesComponent from '../../../components/dashboard/QRCodesComponent';
import apiService from '../../../lib/api';

const RestaurantDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [resID, setResID] = useState('RES001'); // This should come from auth/session
  const [restaurantInfo, setRestaurantInfo] = useState(null);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);

  useEffect(() => {
    // Set up authentication token if available
    // const token = localStorage.getItem('authToken');
    // if (token) {
    //   apiService.setToken(token);
    // }

    // For demo purposes, we'll use a hardcoded resID
    // In production, this should come from authentication context
    fetchRestaurantInfo();
    fetchPendingOrders();
  }, []);

  const fetchRestaurantInfo = async () => {
    try {
      // This would typically come from auth context
      setRestaurantInfo({
        name: 'Demo Restaurant',
        resID: resID
      });
    } catch (err) {
      console.error('Error fetching restaurant info:', err);
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


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Logo in top-left corner */}
      <div className="fixed top-6 left-6 z-50">
        <div className="w-14 h-14 relative">
          <Image
            src="/images/logo.png"
            alt="Logo"
            fill
            className="object-contain filter drop-shadow-lg"
            priority
          />
        </div>
      </div>

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Restaurant Dashboard</h1>
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