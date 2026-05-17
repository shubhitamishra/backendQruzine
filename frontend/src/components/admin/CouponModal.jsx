import React, { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';

const CouponModal = ({ isOpen, onClose, onSubmit, loading, restaurants }) => {
  const [formData, setFormData] = useState({
    code: '',
    discount: '',
    validityDays: '1',
    restaurant: ''
  });

  const resetForm = () => {
    setFormData({
      code: '',
      discount: '',
      validityDays: '1',
      restaurant: ''
    });
  };

  const handleSubmit = async () => {
    if (!formData.code || !formData.discount) {
      alert('Please fill in required fields');
      return;
    }

    await onSubmit(formData);
    resetForm();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Create Coupon Code</h3>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Coupon Code *"
            value={formData.code}
            onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            placeholder="Discount % *"
            value={formData.discount}
            onChange={(e) => setFormData({...formData, discount: e.target.value})}
            min="1"
            max="100"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={formData.validityDays}
            onChange={(e) => setFormData({...formData, validityDays: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1">24 Hours</option>
            <option value="2">48 Hours</option>
            <option value="3">72 Hours</option>
            <option value="7">7 Days</option>
            <option value="30">30 Days</option>
          </select>
          <select
            value={formData.restaurant}
            onChange={(e) => setFormData({...formData, restaurant: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Restaurants</option>
            {restaurants.map(r => (
              <option key={r._id} value={r._id}>{r.name}</option>
            ))}
          </select>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.code || !formData.discount}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <LoadingSpinner size="small" />}
            Create Coupon
          </button>
        </div>
      </div>
    </div>
  );
};

export default CouponModal;
