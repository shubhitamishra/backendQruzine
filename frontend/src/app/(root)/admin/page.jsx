"use client";
import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Plus, Settings, AlertCircle, CheckCircle, XCircle, X } from 'lucide-react';

// Import components
import apiService from '../../../components/admin/ApiService';
import { useApi, useDebounce } from '../../../components/admin/hooks';
import LoadingSpinner from '../../../components/admin/LoadingSpinner';
import DashboardStats from '../../../components/admin/DashboardStats';
import RestaurantTable from '../../../components/admin/RestaurantTable';
import AddRestaurantModal from '../../../components/admin/AddRestaurantModal';
import CouponModal from '../../../components/admin/CouponModal';
import BugsModal from '../../../components/admin/BugsModal';
import BannerManager from '../../../components/admin/BannerManager';

// Toast Component
const Toast = ({ toast, onClose }) => {
  const getToastStyles = () => {
    const baseStyles = "p-4 rounded-lg shadow-lg max-w-sm w-full flex items-center gap-3";
    switch (toast.type) {
      case 'success':
        return `${baseStyles} bg-green-50 border border-green-200 text-green-800`;
      case 'error':
        return `${baseStyles} bg-red-50 border border-red-200 text-red-800`;
      case 'warning':
        return `${baseStyles} bg-yellow-50 border border-yellow-200 text-yellow-800`;
      default:
        return `${baseStyles} bg-blue-50 border border-blue-200 text-blue-800`;
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <div className={`${getToastStyles()} animate-slide-in`}>
      {getIcon()}
      <div className="flex-1">
        {toast.title && <div className="font-medium">{toast.title}</div>}
        <div className={toast.title ? "text-medium" : ""}>{toast.message}</div>
      </div>
      <button
        onClick={() => onClose(toast.id)}
        className="text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

// Toast Container
const ToastContainer = ({ toasts, onClose }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-2 right-2 md:top-4 md:right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
};

// Custom hook for toast management
const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = (toast) => {
    const id = Date.now() + Math.random();
    const newToast = { id, ...toast };
    
    setToasts(prev => [...prev, newToast]);

    // Auto remove after 5 seconds (or custom duration)
    setTimeout(() => {
      removeToast(id);
    }, toast.duration || 5000);

    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showSuccess = (message, title) => {
    return addToast({ type: 'success', message, title });
  };

  const showError = (message, title) => {
    return addToast({ type: 'error', message, title });
  };

  const showWarning = (message, title) => {
    return addToast({ type: 'warning', message, title });
  };

  const showInfo = (message, title) => {
    return addToast({ type: 'info', message, title });
  };

  return {
    toasts,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeToast
  };
};

// Confirmation Modal Component
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Delete", cancelText = "Cancel", type = "danger" }) => {
  if (!isOpen) return null;

  const getConfirmButtonStyles = () => {
    switch (type) {
      case 'danger':
        return "bg-red-500 hover:bg-red-600 text-white";
      case 'warning':
        return "bg-yellow-500 hover:bg-yellow-600 text-white";
      default:
        return "bg-blue-500 hover:bg-blue-600 text-white";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg transition-colors ${getConfirmButtonStyles()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [showBugsModal, setShowBugsModal] = useState(false);
  const [bugs, setBugs] = useState([]);
  const [actionLoading, setActionLoading] = useState({});
  const [confirmModal, setConfirmModal] = useState({ isOpen: false });

  // Location states
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState([]);
  const [locationLoading, setLocationLoading] = useState({});

  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const { toasts, showSuccess, showError, showWarning, removeToast } = useToast();

  // API Hooks
  const { data: stats, loading: statsLoading, error: statsError, refetch: refetchStats } = useApi(
    () => apiService.getDashboardStats(),
    []
  );

  const { data: restaurantData, loading: restaurantsLoading, error: restaurantsError, refetch: refetchRestaurants } = useApi(
    () => apiService.getRestaurants(currentPage, 10, debouncedSearchTerm),
    [currentPage, debouncedSearchTerm]
  );

  const { data: bugsData, loading: bugsLoading, refetch: refetchBugs } = useApi(
    () => apiService.getBugReports(),
    []
  );

  // Update restaurants when data changes
  useEffect(() => {
    if (restaurantData) {
      setRestaurants(restaurantData.data);
      setPagination(restaurantData.pagination);
    }
  }, [restaurantData]);

  useEffect(() => {
    if (bugsData) {
      setBugs(bugsData);
    }
  }, [bugsData]);

  // Load states on component mount
  useEffect(() => {
    loadStates();
  }, []);

  const pendingBugsCount = useMemo(() => {
    return bugs.filter(bug => bug.status === 'pending').length;
  }, [bugs]);

  // Location handlers
  const loadStates = async () => {
    try {
      setLocationLoading(prev => ({ ...prev, states: true }));
      const response = await apiService.getStates();
      if (response.success) {
        setStates(response.data);
      }
    } catch (error) {
      console.error('Failed to load states:', error);
      showError('Failed to load states. Please try again.');
    } finally {
      setLocationLoading(prev => ({ ...prev, states: false }));
    }
  };

  const loadCities = async (state) => {
    if (!state) {
      setCities([]);
      setAreas([]);
      return;
    }

    try {
      setLocationLoading(prev => ({ ...prev, cities: true }));
      const response = await apiService.getCities(state);
      if (response.success) {
        setCities(response.data);
        setAreas([]); // Reset areas when state changes
      }
    } catch (error) {
      console.error('Failed to load cities:', error);
      setCities([]);
      showError('Failed to load cities. Please try again.');
    } finally {
      setLocationLoading(prev => ({ ...prev, cities: false }));
    }
  };

  const loadAreas = async (city) => {
    if (!city) {
      setAreas([]);
      return;
    }

    try {
      setLocationLoading(prev => ({ ...prev, areas: true }));
      const response = await apiService.getAreas(city);
      if (response.success) {
        setAreas(response.data);
      }
    } catch (error) {
      console.error('Failed to load areas:', error);
      setAreas([]);
      showError('Failed to load areas. Please try again.');
    } finally {
      setLocationLoading(prev => ({ ...prev, areas: false }));
    }
  };

  // Handle location changes
  const handleStateChange = (state) => {
    loadCities(state);
  };

  const handleCityChange = (city) => {
    loadAreas(city);
  };

  const handleAreaChange = (area) => {
    // Area change handler if needed
  };

  // Action handlers
  const handleAddRestaurant = async (restaurantData) => {
    try {
      setActionLoading(prev => ({ ...prev, addRestaurant: true }));
      const result = await apiService.createRestaurant(restaurantData);
      
      // Reset location data
      setCities([]);
      setAreas([]);
      
      // Refresh data
      await Promise.all([refetchRestaurants(), refetchStats()]);
      
      showSuccess(`Restaurant "${restaurantData.name}" has been added successfully!`, 'Restaurant Added');
      
      // Return the result so AddRestaurantModal can show share options
      return result;
    } catch (error) {
      showError(`Failed to add restaurant: ${error.message}`, 'Error');
      throw error;
    } finally {
      setActionLoading(prev => ({ ...prev, addRestaurant: false }));
    }
  };

  const handleSendCredentialsEmail = async (restaurantData) => {
    try {
      await apiService.sendRestaurantCredentials(restaurantData);
      showSuccess('Credentials email sent successfully!', 'Email Sent');
      return { success: true };
    } catch (error) {
      console.error('Failed to send credentials email:', error);
      showError(error.response?.data?.message || 'Failed to send email', 'Email Error');
      throw new Error(error.response?.data?.message || 'Failed to send email');
    }
  };

  const handleExport = async (restaurantId, format) => {
    try {
      setActionLoading(prev => ({ ...prev, [`export-${restaurantId}-${format}`]: true }));
      
      const blob = await apiService.exportRestaurantData(restaurantId, format);
      const restaurant = restaurants.find(r => r.resID === restaurantId);
      const filename = `${restaurant?.name || 'restaurant'}_data.${format}`;
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showSuccess(`Data exported successfully as ${format.toUpperCase()}!`, 'Export Complete');
    } catch (error) {
      showError(`Failed to export data: ${error.message}`, 'Export Error');
    } finally {
      setActionLoading(prev => ({ ...prev, [`export-${restaurantId}-${format}`]: false }));
    }
  };

  const handleDeleteRestaurant = async (restaurantId, restaurantName) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Restaurant',
      message: `Are you sure you want to delete "${restaurantName}"? This action cannot be undone and will delete all related data.`,
      onConfirm: async () => {
        try {
          setActionLoading(prev => ({ ...prev, [`delete-${restaurantId}`]: true }));
          await apiService.deleteRestaurant(restaurantId);
          
          // Refresh data
          await Promise.all([refetchRestaurants(), refetchStats()]);
          showSuccess(`Restaurant "${restaurantName}" has been deleted successfully!`, 'Restaurant Deleted');
        } catch (error) {
          showError(`Failed to delete restaurant: ${error.message}`, 'Delete Error');
        } finally {
          setActionLoading(prev => ({ ...prev, [`delete-${restaurantId}`]: false }));
          setConfirmModal({ isOpen: false });
        }
      },
      onClose: () => setConfirmModal({ isOpen: false })
    });
  };

  const handleToggleRestaurantStatus = async (restaurantId) => {
    try {
      setActionLoading(prev => ({ ...prev, [`toggle-${restaurantId}`]: true }));
      await apiService.toggleRestaurantStatus(restaurantId);
      
      // Refresh data
      await Promise.all([refetchRestaurants(), refetchStats()]);
      showSuccess('Restaurant status updated successfully!', 'Status Updated');
    } catch (error) {
      showError(`Failed to update restaurant status: ${error.message}`, 'Status Error');
    } finally {
      setActionLoading(prev => ({ ...prev, [`toggle-${restaurantId}`]: false }));
    }
  };

  const createCoupon = async (couponData) => {
    try {
      setActionLoading(prev => ({ ...prev, createCoupon: true }));
      await apiService.createCoupon(couponData);
      
      setShowCouponModal(false);
      showSuccess('Coupon created successfully!', 'Coupon Created');
    } catch (error) {
      showError(`Failed to create coupon: ${error.message}`, 'Coupon Error');
    } finally {
      setActionLoading(prev => ({ ...prev, createCoupon: false }));
    }
  };

  const toggleBugStatus = async (bugId) => {
    const bug = bugs.find(b => b.id === bugId);
    if (!bug) return;

    const newStatus = bug.status === 'pending' ? 'resolved' : 'pending';
    
    try {
      setActionLoading(prev => ({ ...prev, [`bug-${bugId}`]: true }));
      await apiService.updateBugStatus(bugId, newStatus);
      
      setBugs(prevBugs => 
        prevBugs.map(b => 
          b.id === bugId ? { ...b, status: newStatus } : b
        )
      );
      
      showSuccess(`Bug marked as ${newStatus}!`, 'Bug Status Updated');
    } catch (error) {
      showError(`Failed to update bug status: ${error.message}`, 'Bug Update Error');
    } finally {
      setActionLoading(prev => ({ ...prev, [`bug-${bugId}`]: false }));
    }
  };

  if (statsLoading && restaurantsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Logo in top-left corner */}
      <div className="hidden md:block fixed top-3 left-3 md:top-6 md:left-6 z-50">
        <div className="w-10 h-10 md:w-14 md:h-14 relative">
          <Image
            src="/images/logo.png"
            alt="Logo"
            fill
            className="object-contain filter drop-shadow-lg"
            priority
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          {/* Mobile: inline logo with title to avoid overlap */}
          <div className="flex items-center gap-2 md:hidden">
            <Image src="/images/logo.png" alt="Logo" width={28} height={28} className="object-contain" priority />
            <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
          </div>
          {/* Desktop: larger standalone title */}
          <h1 className="hidden md:block text-3xl font-bold text-gray-900 mb-2">Super Admin Dashboard</h1>
          <p className="text-sm md:text-base text-gray-600">Manage restaurants and monitor platform performance</p>
        </div>

        {/* Dashboard Stats */}
        <DashboardStats 
          stats={stats}
          loading={statsLoading}
          error={statsError}
          onRetry={refetchStats}
        />

        {/* Action Buttons */}
        <div className="w-full flex flex-col sm:flex-row sm:flex-wrap gap-3 md:gap-4 mb-6 md:mb-8">
          <button
            onClick={() => setShowAddModal(true)}
            disabled={actionLoading.addRestaurant}
            className="w-full sm:w-auto justify-center bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-5 md:px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            {actionLoading.addRestaurant ? <LoadingSpinner size="small" /> : <Plus className="h-4 w-4" />}
            Add Restaurant
          </button>
          <button
            onClick={() => setShowCouponModal(true)}
            className="w-full sm:w-auto justify-center bg-green-500 hover:bg-green-600 text-white px-5 md:px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Settings className="h-4 w-4" />
            Create Coupon
          </button>
          <button
            onClick={() => setShowBugsModal(true)}
            className="w-full sm:w-auto justify-center bg-orange-500 hover:bg-orange-600 text-white px-5 md:px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <AlertCircle className="h-4 w-4" />
            View Bugs ({pendingBugsCount})
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-5 md:mb-6">
          <input
            type="text"
            placeholder="Search restaurants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Restaurant Table */}
        <RestaurantTable
          restaurants={restaurants}
          loading={restaurantsLoading}
          error={restaurantsError}
          onRetry={refetchRestaurants}
          onExport={handleExport}
          onDelete={handleDeleteRestaurant}
          onToggleStatus={handleToggleRestaurantStatus}
          actionLoading={actionLoading}
          pagination={pagination}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onSendCredentialsEmail={handleSendCredentialsEmail}
        />

        {/* Banner Manager Section */}
        <BannerManager />

        {/* Modals */}
        <AddRestaurantModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddRestaurant}
          loading={actionLoading.addRestaurant}
          states={states}
          cities={cities}
          areas={areas}
          locationLoading={locationLoading}
          onStateChange={handleStateChange}
          onCityChange={handleCityChange}
          onAreaChange={handleAreaChange}
          onSendCredentialsEmail={handleSendCredentialsEmail}
        />

        <CouponModal
          isOpen={showCouponModal}
          onClose={() => setShowCouponModal(false)}
          onSubmit={createCoupon}
          loading={actionLoading.createCoupon}
          restaurants={restaurants}
        />

        <BugsModal
          isOpen={showBugsModal}
          onClose={() => setShowBugsModal(false)}
          bugs={bugs}
          loading={bugsLoading}
          onToggleStatus={toggleBugStatus}
          actionLoading={actionLoading}
        />

        {/* Confirmation Modal */}
        <ConfirmationModal {...confirmModal} />

        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </div>

      {/* Toast Animation Styles */}
      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;