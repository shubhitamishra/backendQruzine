import React, { useState } from 'react';
import { Download, Trash2, Power, PowerOff, Share2 } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import ShareCredentialsModal from './ShareCredentialsModal';
import apiService from './ApiService';

const RestaurantTable = ({ 
  restaurants, 
  loading, 
  error, 
  onRetry, 
  onExport, 
  onDelete, 
  onToggleStatus,
  actionLoading,
  pagination,
  currentPage,
  onPageChange,
  onSendCredentialsEmail = async () => {},
}) => {
  const [shareOpen, setShareOpen] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [shareLoading, setShareLoading] = useState(false);

  const openShare = async (restaurant) => {
    try {
      setShareLoading(true);
      // If password is missing (typical for list API), reset credentials to get a fresh password
      if (!restaurant?.credentials?.password) {
        const resp = await apiService.resetRestaurantCredentials(restaurant.resID);
        if (resp?.success && resp.data) {
          const { adminId, password } = resp.data;
          setSelectedRestaurant({
            ...restaurant,
            credentials: {
              adminId: adminId || restaurant.credentials?.adminId,
              password,
            },
          });
        } else {
          // Fallback: open without password to allow email-only sharing or WhatsApp copy sans password
          setSelectedRestaurant(restaurant);
        }
      } else {
        setSelectedRestaurant(restaurant);
      }
      setShareOpen(true);
    } catch (e) {
      console.error('Failed to prepare credentials for sharing:', e);
      alert(e?.response?.data?.message || e?.message || 'Failed to fetch credentials');
    } finally {
      setShareLoading(false);
    }
  };
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Restaurants</h2>
        </div>
        <div className="p-8">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Restaurants</h2>
        </div>
        <div className="p-6">
          <ErrorMessage message={error} onRetry={onRetry} />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Restaurants</h2>
      </div>

      {/* Mobile cards */}
      <div className="block md:hidden divide-y">
        {restaurants.map((restaurant) => (
          <div key={restaurant._id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-base font-semibold text-gray-900">{restaurant.name}</div>
                <div className="text-xs text-gray-500">{restaurant.businessType}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {restaurant.location?.address || restaurant.location}
                  {restaurant.location?.city && `, ${restaurant.location.city}`}
                  {restaurant.location?.state && `, ${restaurant.location.state}`}
                </div>
                <div className="text-xs text-gray-700 mt-2">
                  {restaurant.contactInfo?.phone} • {restaurant.contactInfo?.email}
                </div>
                <div className={`text-xs mt-1 ${restaurant.isActive ? 'text-green-600' : 'text-red-600'}`}>Status: {restaurant.isActive ? 'Active' : 'Inactive'}</div>
                <div className="text-xs text-gray-700 mt-1">Admin ID: {restaurant.credentials?.adminId}</div>
                <div className="text-xs text-gray-700">Password: ••••••••</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                onClick={() => onExport(restaurant.resID, 'csv')}
                disabled={actionLoading[`export-${restaurant.resID}-csv`]}
                className="px-2 py-1 text-xs border border-gray-300 rounded text-blue-700 hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1"
                title="Export CSV"
              >
                {actionLoading[`export-${restaurant.resID}-csv`] ? <LoadingSpinner size="small" /> : <Download className="h-3 w-3" />}
                CSV
              </button>
              <button
                onClick={() => onExport(restaurant.resID, 'xlsx')}
                disabled={actionLoading[`export-${restaurant.resID}-xlsx`]}
                className="px-2 py-1 text-xs border border-gray-300 rounded text-green-700 hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1"
                title="Export XLSX"
              >
                {actionLoading[`export-${restaurant.resID}-xlsx`] ? <LoadingSpinner size="small" /> : <Download className="h-3 w-3" />}
                XLSX
              </button>
              <button
                onClick={() => openShare(restaurant)}
                className="px-2 py-1 text-xs border border-gray-300 rounded text-emerald-700 hover:bg-gray-50 flex items-center gap-1"
                title="Share Credentials"
              >
                <Share2 className="h-3 w-3" />
                Share
              </button>
              <button
                onClick={() => onToggleStatus(restaurant.resID)}
                disabled={actionLoading[`toggle-${restaurant.resID}`]}
                className={`px-2 py-1 text-xs border border-gray-300 rounded disabled:opacity-50 flex items-center gap-1 ${restaurant.isActive ? 'text-orange-700' : 'text-green-700'}`}
                title={restaurant.isActive ? 'Disable Restaurant' : 'Enable Restaurant'}
              >
                {actionLoading[`toggle-${restaurant.resID}`] ? (
                  <LoadingSpinner size="small" />
                ) : restaurant.isActive ? (
                  <PowerOff className="h-3 w-3" />
                ) : (
                  <Power className="h-3 w-3" />
                )}
                {restaurant.isActive ? 'Disable' : 'Enable'}
              </button>
              <button
                onClick={() => onDelete(restaurant.resID, restaurant.name)}
                disabled={actionLoading[`delete-${restaurant.resID}`]}
                className="px-2 py-1 text-xs border border-gray-300 rounded text-red-700 hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1"
                title="Delete Restaurant"
              >
                {actionLoading[`delete-${restaurant.resID}`] ? <LoadingSpinner size="small" /> : <Trash2 className="h-3 w-3" />}
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="overflow-x-auto hidden md:block">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Restaurant</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stats</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credentials</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {restaurants.map((restaurant) => (
              <tr key={restaurant._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{restaurant.name}</div>
                    <div className="text-sm text-gray-500">{restaurant.businessType}</div>
                    <div className="text-sm text-gray-500">
                      {restaurant.location?.address || restaurant.location}
                      {restaurant.location?.city && `, ${restaurant.location.city}`}
                      {restaurant.location?.state && `, ${restaurant.location.state}`}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{restaurant.contactInfo?.phone}</div>
                  <div className="text-sm text-gray-500">{restaurant.contactInfo?.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">Orders: {restaurant.stats?.totalOrders || 0}</div>
                  <div className="text-sm text-gray-500">Menu Items: {restaurant.stats?.totalMenuItems || 0}</div>
                  <div className="text-sm text-gray-500">QR Codes: {restaurant.stats?.totalQRCodes || 0}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">ID: {restaurant.credentials?.adminId}</div>
                  <div className="text-sm text-gray-900">Password: ••••••••</div>
                  <div className={`text-sm ${restaurant.isActive ? 'text-green-600' : 'text-red-600'}`}>Status: {restaurant.isActive ? 'Active' : 'Inactive'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex gap-2">
                    
                    <button
                      onClick={() => onExport(restaurant.resID, 'xlsx')}
                      disabled={actionLoading[`export-${restaurant.resID}-xlsx`]}
                      className="text-green-600 hover:text-green-900 flex items-center gap-1 disabled:opacity-50"
                      title="Export XLSX"
                    >
                      {actionLoading[`export-${restaurant.resID}-xlsx`] ? <LoadingSpinner size="small" /> : <Download className="h-4 w-4" />}
                      Excel
                    </button>
                    <button
                      onClick={() => openShare(restaurant)}
                      className="text-emerald-600 hover:text-emerald-900 flex items-center gap-1"
                      title="Share Credentials"
                    >
                      <Share2 className="h-4 w-4" />
                      Share
                    </button>
                    <button
                      onClick={() => onToggleStatus(restaurant.resID)}
                      disabled={actionLoading[`toggle-${restaurant.resID}`]}
                      className={`flex items-center gap-1 disabled:opacity-50 ${
                        restaurant.isActive 
                          ? 'text-orange-600 hover:text-orange-900' 
                          : 'text-green-600 hover:text-green-900'
                      }`}
                      title={restaurant.isActive ? 'Disable Restaurant' : 'Enable Restaurant'}
                    >
                      {actionLoading[`toggle-${restaurant.resID}`] ? (
                        <LoadingSpinner size="small" />
                      ) : restaurant.isActive ? (
                        <PowerOff className="h-4 w-4" />
                      ) : (
                        <Power className="h-4 w-4" />
                      )}
                      {restaurant.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => onDelete(restaurant.resID, restaurant.name)}
                      disabled={actionLoading[`delete-${restaurant.resID}`]}
                      className="text-red-600 hover:text-red-900 flex items-center gap-1 disabled:opacity-50"
                      title="Delete Restaurant"
                    >
                      {actionLoading[`delete-${restaurant.resID}`] ? <LoadingSpinner size="small" /> : <Trash2 className="h-4 w-4" />}
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="px-4 md:px-6 py-4 border-t border-gray-200 flex flex-col md:flex-row gap-3 md:gap-0 items-start md:items-center justify-start md:justify-between">
          <div className="text-sm text-gray-700">
            Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
            {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
            {pagination.totalItems} results
          </div>
          <div className="w-full md:w-auto flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
              className="w-full sm:w-auto px-3 py-1 border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(Math.min(currentPage + 1, pagination.totalPages))}
              disabled={currentPage === pagination.totalPages}
              className="w-full sm:w-auto px-3 py-1 border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Share Credentials Modal */}
      <ShareCredentialsModal
        isOpen={shareOpen}
        onClose={() => { setShareOpen(false); setSelectedRestaurant(null); }}
        restaurantData={selectedRestaurant}
        onSendEmail={onSendCredentialsEmail}
        loading={shareLoading}
      />
    </div>
  );
};

export default RestaurantTable;
