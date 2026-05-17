import React, { useState, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';
import ShareCredentialsModal from './ShareCredentialsModal';

const AddRestaurantModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  loading,
  states,
  cities,
  areas,
  locationLoading,
  onStateChange,
  onCityChange,
  onAreaChange,
  onSendCredentialsEmail
}) => {
  const [formData, setFormData] = useState({
    name: '',
    location: {
      address: '',
      state: '',
      city: '',
      area: '',
      pincode: ''
    },
    businessType: 'Restaurant',
    contactInfo: {
      phone: '',
      email: '',
      website: ''
    },
    gstNumber: ''
  });
  const [showShareModal, setShowShareModal] = useState(false);
  const [createdRestaurant, setCreatedRestaurant] = useState(null);

  const resetForm = () => {
    setFormData({
      name: '',
      location: {
        address: '',
        state: '',
        city: '',
        area: '',
        pincode: ''
      },
      businessType: 'Restaurant',
      contactInfo: { phone: '', email: '', website: '' },
      gstNumber: ''
    });
  };

  const handleSubmit = async () => {
    const { name, location, gstNumber, contactInfo } = formData;
    
    if (!name || !location.address || !location.state || !location.city) {
      alert('Please fill in all required fields (Name, Address, State, City)');
      return;
    }
    
    try {
      const result = await onSubmit(formData);
      if (result && result.data) {
        setCreatedRestaurant(result.data);
        setShowShareModal(true);
      }
      resetForm();
    } catch (error) {
      console.error('Error creating restaurant:', error);
    }
  };

  const handleClose = () => {
    resetForm();
    setShowShareModal(false);
    setCreatedRestaurant(null);
    onClose();
  };

  const handleShareModalClose = () => {
    setShowShareModal(false);
    setCreatedRestaurant(null);
    onClose();
  };

  const handleStateChange = (state) => {
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        state,
        city: '',
        area: ''
      }
    }));
    onStateChange(state);
  };

  const handleCityChange = (city) => {
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        city,
        area: ''
      }
    }));
    onCityChange(city);
  };

  const handleAreaChange = (area) => {
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        area
      }
    }));
    onAreaChange(area);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      { !showShareModal && (
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Restaurant</h3>
        
        <div className="space-y-4">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Restaurant Name *
              </label>
              <input
                type="text"
                placeholder="Restaurant Name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Type
              </label>
              <select
                value={formData.businessType}
                onChange={(e) => setFormData({...formData, businessType: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Restaurant">Restaurant</option>
                <option value="Cafe">Cafe</option>
                <option value="Fast Food">Fast Food</option>
                <option value="Fine Dining">Fine Dining</option>
                <option value="Bar">Bar</option>
                <option value="Food Truck">Food Truck</option>
              </select>
            </div>
          </div>

          {/* Location Information */}
          <div className="border-t pt-4">
            <h4 className="text-md font-medium text-gray-800 mb-3">Location Details</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address *
                </label>
                <textarea
                  placeholder="Complete address"
                  value={formData.location.address}
                  onChange={(e) => setFormData({
                    ...formData, 
                    location: {...formData.location, address: e.target.value}
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State *
                  </label>
                  <select
                    value={formData.location.state}
                    onChange={(e) => handleStateChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={locationLoading.states}
                  >
                    <option value="">Select State</option>
                    {states.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                  {locationLoading.states && (
                    <div className="mt-1">
                      <LoadingSpinner size="small" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <select
                    value={formData.location.city}
                    onChange={(e) => handleCityChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={!formData.location.state || locationLoading.cities}
                  >
                    <option value="">Select City</option>
                    {cities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                  {locationLoading.cities && (
                    <div className="mt-1">
                      <LoadingSpinner size="small" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Area
                  </label>
                  <select
                    value={formData.location.area}
                    onChange={(e) => handleAreaChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!formData.location.city || locationLoading.areas}
                  >
                    <option value="">Select Area (Optional)</option>
                    {areas.map(area => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                  {locationLoading.areas && (
                    <div className="mt-1">
                      <LoadingSpinner size="small" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pincode
                </label>
                <input
                  type="text"
                  placeholder="Pincode"
                  value={formData.location.pincode}
                  onChange={(e) => setFormData({
                    ...formData, 
                    location: {...formData.location, pincode: e.target.value}
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={6}
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="border-t pt-4">
            <h4 className="text-md font-medium text-gray-800 mb-3">Contact Information</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={formData.contactInfo.phone}
                  onChange={(e) => setFormData({
                    ...formData, 
                    contactInfo: {...formData.contactInfo, phone: e.target.value}
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="Email Address"
                  value={formData.contactInfo.email}
                  onChange={(e) => setFormData({
                    ...formData,
                    contactInfo: {...formData.contactInfo, email: e.target.value}
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <input
                type="url"
                placeholder="Website URL"
                value={formData.contactInfo.website}
                onChange={(e) => setFormData({
                  ...formData,
                  contactInfo: {...formData.contactInfo, website: e.target.value}
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Business Information */}
          <div className="border-t pt-4">
            <h4 className="text-md font-medium text-gray-800 mb-3">Business Information</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GST Number
              </label>
              <input
                type="text"
                placeholder="GST Number"
                value={formData.gstNumber}
                onChange={(e) => setFormData({...formData, gstNumber: e.target.value.toUpperCase()})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={15}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3 border-t pt-4">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <LoadingSpinner size="small" />}
            Add Restaurant
          </button>
        </div>
      </div>
      )}
      
      {/* Share Credentials Modal */}
      <ShareCredentialsModal
        isOpen={showShareModal}
        onClose={handleShareModalClose}
        restaurantData={createdRestaurant}
        onSendEmail={onSendCredentialsEmail}
        loading={loading}
      />
    </div>
  );
};

export default AddRestaurantModal;
