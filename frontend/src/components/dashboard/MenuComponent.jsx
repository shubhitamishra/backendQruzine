import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Clock, 
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  X,
  Save,
  Upload,
  Image as ImageIcon,
  Minus
} from 'lucide-react';
import apiService from '../../lib/api';
import CategoryManager from './CategoryManager';

const MenuComponent = ({ resID }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    search: '',
    available: ''
  });

  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    basePrice: '',
    variants: [],
    category: '',
    isVegetarian: false,
    isVegan: false,
    isSpecialItem: false,
    preparationTime: '',
    taxPercentage: '',
    ingredients: [],
    allergens: [],
    image: ''
  });

  useEffect(() => {
    fetchMenuItems();
    fetchCategories();
  }, [resID, filters]);

  const handleCategoryChange = (updatedCategories) => {
    setCategories(updatedCategories);
  };

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const response = await apiService.getMenuItems(resID, filters);
      setMenuItems(response.data.items);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching menu items:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await apiService.getCategories(resID);
      setCategories(response.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleImageUpload = async (file, isEditing = false) => {
    if (!file) return;

    try {
      setUploading(true);
      const response = await apiService.uploadImage(resID, file);
      
      if (isEditing) {
        setEditingItem(prev => ({
          ...prev,
          image: response.data.url
        }));
      } else {
        setNewItem(prev => ({
          ...prev,
          image: response.data.url
        }));
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      alert('Failed to upload image: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const addVariant = (isEditing = false) => {
    const newVariant = { name: '', price: '', description: '' };
    if (isEditing) {
      setEditingItem(prev => ({
        ...prev,
        variants: [...(prev.variants || []), newVariant]
      }));
    } else {
      setNewItem(prev => ({
        ...prev,
        variants: [...prev.variants, newVariant]
      }));
    }
  };

  const removeVariant = (index, isEditing = false) => {
    if (isEditing) {
      setEditingItem(prev => ({
        ...prev,
        variants: prev.variants.filter((_, i) => i !== index)
      }));
    } else {
      setNewItem(prev => ({
        ...prev,
        variants: prev.variants.filter((_, i) => i !== index)
      }));
    }
  };

  const updateVariant = (index, field, value, isEditing = false) => {
    if (isEditing) {
      setEditingItem(prev => ({
        ...prev,
        variants: prev.variants.map((variant, i) => 
          i === index ? { ...variant, [field]: value } : variant
        )
      }));
    } else {
      setNewItem(prev => ({
        ...prev,
        variants: prev.variants.map((variant, i) => 
          i === index ? { ...variant, [field]: value } : variant
        )
      }));
    }
  };

  const toggleMenuItemAvailability = async (menuID) => {
    try {
      await apiService.toggleMenuItemAvailability(resID, menuID);
      setMenuItems(prevItems =>
        prevItems.map(item =>
          item.menuID === menuID ? { ...item, isAvailable: !item.isAvailable } : item
        )
      );
    } catch (err) {
      console.error('Error toggling availability:', err);
      alert('Failed to update item availability: ' + err.message);
    }
  };

  const addMenuItem = async () => {
    try {
      if (!newItem.name || !newItem.category || !newItem.image) {
        alert('Please fill in name, category, and upload an image');
        return;
      }

      if (!newItem.taxPercentage || parseFloat(newItem.taxPercentage) < 0) {
        alert('Tax percentage is required and must be 0 or greater');
        return;
      }

      // Validate pricing
      if (newItem.variants.length > 0) {
        // Check if all variants have valid prices
        for (const variant of newItem.variants) {
          if (!variant.name || !variant.price || parseFloat(variant.price) < 0) {
            alert('All variants must have a name and valid price');
            return;
          }
        }
      } else if (!newItem.basePrice || parseFloat(newItem.basePrice) < 0) {
        alert('Base price is required when no variants are provided');
        return;
      }

      const itemData = {
        ...newItem,
        basePrice: parseFloat(newItem.basePrice) || 0,
        variants: newItem.variants.map(variant => ({
          ...variant,
          price: parseFloat(variant.price)
        })),
        preparationTime: parseInt(newItem.preparationTime) || 0,
        taxPercentage: parseFloat(newItem.taxPercentage),
        ingredients: newItem.ingredients,
        allergens: newItem.allergens,
      };

      const response = await apiService.addMenuItem(resID, itemData);
      setMenuItems(prev => [...prev, response.data]);
      resetForm();
      setShowAddItem(false);
      fetchCategories(); // Refresh categories
    } catch (err) {
      console.error('Error adding menu item:', err);
      alert('Failed to add menu item: ' + err.message);
    }
  };

  const updateMenuItem = async () => {
    try {
      if (!editingItem.name || !editingItem.category) {
        alert('Please fill in name and category');
        return;
      }

      if (!editingItem.taxPercentage || parseFloat(editingItem.taxPercentage) < 0) {
        alert('Tax percentage is required and must be 0 or greater');
        return;
      }

      // Validate pricing
      if (editingItem.variants && editingItem.variants.length > 0) {
        // Check if all variants have valid prices
        for (const variant of editingItem.variants) {
          if (!variant.name || !variant.price || parseFloat(variant.price) < 0) {
            alert('All variants must have a name and valid price');
            return;
          }
        }
      } else if (!editingItem.basePrice && !editingItem.price) {
        alert('Base price is required when no variants are provided');
        return;
      }

      const itemData = {
        ...editingItem,
        basePrice: parseFloat(editingItem.basePrice || editingItem.price) || 0,
        variants: editingItem.variants ? editingItem.variants.map(variant => ({
          ...variant,
          price: parseFloat(variant.price)
        })) : [],
        preparationTime: parseInt(editingItem.preparationTime) || 0,
        taxPercentage: parseFloat(editingItem.taxPercentage),
        ingredients: editingItem.ingredients || [],
        allergens: editingItem.allergens || [],
      };

      const response = await apiService.updateMenuItem(resID, editingItem.menuID, itemData);
      setMenuItems(prev =>
        prev.map(item =>
          item.menuID === editingItem.menuID ? response.data : item
        )
      );
      setEditingItem(null);
      fetchCategories(); // Refresh categories
    } catch (err) {
      console.error('Error updating menu item:', err);
      alert('Failed to update menu item: ' + err.message);
    }
  };

  const deleteMenuItem = async (menuID) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;

    try {
      await apiService.deleteMenuItem(resID, menuID);
      setMenuItems(prev => prev.filter(item => item.menuID !== menuID));
      fetchCategories(); // Refresh categories
    } catch (err) {
      console.error('Error deleting menu item:', err);
      alert('Failed to delete menu item: ' + err.message);
    }
  };

  const startEditing = (item) => {
    // Initialize ingredients and allergens as arrays if they're strings
    const editItem = {
      ...item,
      ingredients: Array.isArray(item.ingredients) 
        ? item.ingredients 
        : (item.ingredients ? item.ingredients.split(',').map(i => i.trim()).filter(i => i) : []),
      allergens: Array.isArray(item.allergens) 
        ? item.allergens 
        : (item.allergens ? item.allergens.split(',').map(a => a.trim()).filter(a => a) : []),
      taxPercentage: item.taxPercentage || 0,
      isSpecialItem: item.isSpecialItem || false
    };
    setEditingItem(editItem);
  };

  const resetForm = () => {
    setNewItem({
      name: '',
      description: '',
      basePrice: '',
      variants: [],
      category: '',
      isVegetarian: false,
      isVegan: false,
      isSpecialItem: false,
      preparationTime: '',
      taxPercentage: '',
      ingredients: [],
      allergens: [],
      image: ''
    });
  };

  // Ingredients management functions
  const addIngredient = (isEditing = false) => {
    if (isEditing) {
      setEditingItem(prev => ({
        ...prev,
        ingredients: [...(prev.ingredients || []), '']
      }));
    } else {
      setNewItem(prev => ({
        ...prev,
        ingredients: [...prev.ingredients, '']
      }));
    }
  };

  const removeIngredient = (index, isEditing = false) => {
    if (isEditing) {
      setEditingItem(prev => ({
        ...prev,
        ingredients: prev.ingredients.filter((_, i) => i !== index)
      }));
    } else {
      setNewItem(prev => ({
        ...prev,
        ingredients: prev.ingredients.filter((_, i) => i !== index)
      }));
    }
  };

  const updateIngredient = (index, value, isEditing = false) => {
    if (isEditing) {
      setEditingItem(prev => ({
        ...prev,
        ingredients: prev.ingredients.map((ingredient, i) => 
          i === index ? value : ingredient
        )
      }));
    } else {
      setNewItem(prev => ({
        ...prev,
        ingredients: prev.ingredients.map((ingredient, i) => 
          i === index ? value : ingredient
        )
      }));
    }
  };

  // Allergens management functions
  const addAllergen = (isEditing = false) => {
    if (isEditing) {
      setEditingItem(prev => ({
        ...prev,
        allergens: [...(prev.allergens || []), '']
      }));
    } else {
      setNewItem(prev => ({
        ...prev,
        allergens: [...prev.allergens, '']
      }));
    }
  };

  const removeAllergen = (index, isEditing = false) => {
    if (isEditing) {
      setEditingItem(prev => ({
        ...prev,
        allergens: prev.allergens.filter((_, i) => i !== index)
      }));
    } else {
      setNewItem(prev => ({
        ...prev,
        allergens: prev.allergens.filter((_, i) => i !== index)
      }));
    }
  };

  const updateAllergen = (index, value, isEditing = false) => {
    if (isEditing) {
      setEditingItem(prev => ({
        ...prev,
        allergens: prev.allergens.map((allergen, i) => 
          i === index ? value : allergen
        )
      }));
    } else {
      setNewItem(prev => ({
        ...prev,
        allergens: prev.allergens.map((allergen, i) => 
          i === index ? value : allergen
        )
      }));
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  if (loading && menuItems.length === 0) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-4"></div>
              <div className="h-6 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Menu Management</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCategoryManager(true)}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Manage Categories
          </button>
          <button
            onClick={() => setShowAddItem(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Item
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.categoryID || cat.name} value={cat.name}>
                {cat.name} ({cat.itemCount || 0})
              </option>
            ))}
          </select>

          <select
            value={filters.available}
            onChange={(e) => handleFilterChange('available', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Items</option>
            <option value="true">Available Only</option>
            <option value="false">Unavailable Only</option>
          </select>

          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search items..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={fetchMenuItems}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">Error: {error}</span>
          </div>
        </div>
      )}

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item) => (
          <div key={item._id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                  <p className="text-sm text-gray-600">{item.category}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleMenuItemAvailability(item.menuID)}
                    className={`p-1 rounded ${item.isAvailable ? 'text-green-600' : 'text-gray-400'}`}
                    title={item.isAvailable ? 'Available' : 'Unavailable'}
                  >
                    {item.isAvailable ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <button 
                    onClick={() => setEditingItem(item)}
                    className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => deleteMenuItem(item.menuID)}
                    className="p-1 text-red-600 hover:bg-red-100 rounded"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-3">{item.description}</p>
              
              <div className="flex justify-between items-center mb-3">
                <div>
                  {item.variants && item.variants.length > 0 ? (
                    <div>
                      <span className="text-sm text-gray-600">From </span>
                      <span className="text-lg font-bold text-gray-900">
                        ₹{Math.min(...item.variants.map(v => v.price))}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        {item.variants.length} variant{item.variants.length > 1 ? 's' : ''}
                      </div>
                    </div>
                  ) : (
                    <span className="text-lg font-bold text-gray-900">₹{item.basePrice || 0}</span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  {item.preparationTime}min
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  item.isAvailable 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {item.isAvailable ? 'Available' : 'Unavailable'}
                </span>
                <div className="flex gap-1">
                  {item.isVegetarian && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                      Veg
                    </span>
                  )}
                  {item.isVegan && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                      Vegan
                    </span>
                  )}
                </div>
              </div>

              {item.image && (
                <div className="mt-3">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-32 object-cover rounded-md"
                  />
                </div>
              )}
              
              {item.variants && item.variants.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs font-medium text-gray-700 mb-2">Variants:</p>
                  <div className="space-y-1">
                    {item.variants.slice(0, 3).map((variant, index) => (
                      <div key={index} className="flex justify-between text-xs text-gray-600">
                        <span>{variant.name}</span>
                        <span>₹{variant.price}</span>
                      </div>
                    ))}
                    {item.variants.length > 3 && (
                      <p className="text-xs text-gray-500">+{item.variants.length - 3} more</p>
                    )}
                  </div>
                </div>
              )}
              
              {item.ingredients && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    <strong>Ingredients:</strong> {item.ingredients}
                  </p>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  item.isAvailable 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {item.isAvailable ? 'Available' : 'Unavailable'}
                </span>
                <div className="flex gap-1">
                  {item.isVegetarian && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                      Veg
                    </span>
                  )}
                  {item.isVegan && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                      Vegan
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Category Manager Modal */}
      {showCategoryManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Category Management</h3>
              <button
                onClick={() => setShowCategoryManager(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <CategoryManager resID={resID} onCategoryChange={handleCategoryChange} />
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Add Menu Item</h3>
              <button
                onClick={() => {
                  setShowAddItem(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Item Name *"
                value={newItem.name}
                onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <textarea
                placeholder="Description"
                value={newItem.description}
                onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
              />
              
              {/* Pricing Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pricing
                </label>
                
                {newItem.variants.length === 0 ? (
                  <input
                    type="number"
                    placeholder="Base Price *"
                    value={newItem.basePrice}
                    onChange={(e) => setNewItem({...newItem, basePrice: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    step="0.01"
                  />
                ) : (
                  <div className="text-sm text-gray-600 mb-2">
                    Using variant pricing (base price will be ignored)
                  </div>
                )}
                
                <button
                  type="button"
                  onClick={() => addVariant(false)}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  + Add Variant (Half/Full, Sizes, etc.)
                </button>
              </div>
              
              {/* Variants */}
              {newItem.variants.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Variants
                  </label>
                  <div className="space-y-3">
                    {newItem.variants.map((variant, index) => (
                      <div key={index} className="flex gap-2 items-center p-3 border border-gray-200 rounded-md">
                        <input
                          type="text"
                          placeholder="Variant name (e.g., Half, Small, 250ml)"
                          value={variant.name}
                          onChange={(e) => updateVariant(index, 'name', e.target.value, false)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="number"
                          placeholder="Price"
                          value={variant.price}
                          onChange={(e) => updateVariant(index, 'price', e.target.value, false)}
                          className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          step="0.01"
                        />
                        <button
                          type="button"
                          onClick={() => removeVariant(index, false)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <select
                value={newItem.category}
                onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Category *</option>
                {categories.filter(cat => cat.isActive).map((cat) => (
                  <option key={cat.categoryID || cat.name} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
              
              <input
                type="number"
                placeholder="Tax Percentage (%) *"
                value={newItem.taxPercentage}
                onChange={(e) => setNewItem({...newItem, taxPercentage: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                max="100"
                step="0.01"
              />
              
              <input
                type="number"
                placeholder="Preparation Time (minutes)"
                value={newItem.preparationTime}
                onChange={(e) => setNewItem({...newItem, preparationTime: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <div className="flex items-center gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newItem.isSpecialItem}
                    onChange={(e) => setNewItem({...newItem, isSpecialItem: e.target.checked})}
                    className="mr-2"
                  />
                  Special Item
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newItem.isVegetarian}
                    onChange={(e) => setNewItem({...newItem, isVegetarian: e.target.checked})}
                    className="mr-2"
                  />
                  Vegetarian
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newItem.isVegan}
                    onChange={(e) => setNewItem({...newItem, isVegan: e.target.checked})}
                    className="mr-2"
                  />
                  Vegan
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Food Image
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e.target.files[0], false)}
                    className="hidden"
                    id="food-image-upload"
                  />
                  <label
                    htmlFor="food-image-upload"
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 cursor-pointer"
                  >
                    <Upload className="h-4 w-4" />
                    {uploading ? 'Uploading...' : 'Upload Image'}
                  </label>
                  {newItem.image && (
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600">Image uploaded</span>
                    </div>
                  )}
                </div>
                {newItem.image && (
                  <div className="mt-2">
                    <img
                      src={newItem.image}
                      alt="Preview"
                      className="w-20 h-20 object-cover rounded-md"
                    />
                  </div>
                )}
              </div>
              
              {/* Ingredients Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ingredients
                </label>
                <div className="space-y-2">
                  {newItem.ingredients.map((ingredient, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Enter ingredient"
                        value={ingredient}
                        onChange={(e) => updateIngredient(index, e.target.value, false)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => removeIngredient(index, false)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addIngredient(false)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    + Add Ingredient
                  </button>
                </div>
              </div>
              
              {/* Allergens Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Allergens
                </label>
                <div className="space-y-2">
                  {newItem.allergens.map((allergen, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Enter allergen"
                        value={allergen}
                        onChange={(e) => updateAllergen(index, e.target.value, false)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => removeAllergen(index, false)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addAllergen(false)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    + Add Allergen
                  </button>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddItem(false);
                  resetForm();
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={addMenuItem}
                disabled={uploading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Edit Menu Item</h3>
              <button
                onClick={() => setEditingItem(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Item Name *"
                value={editingItem.name}
                onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <textarea
                placeholder="Description"
                value={editingItem.description}
                onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
              />
              
              {/* Pricing Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pricing
                </label>
                
                {(!editingItem.variants || editingItem.variants.length === 0) ? (
                  <input
                    type="number"
                    placeholder="Base Price *"
                    value={editingItem.basePrice || editingItem.price || ''}
                    onChange={(e) => setEditingItem({...editingItem, basePrice: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    step="0.01"
                  />
                ) : (
                  <div className="text-sm text-gray-600 mb-2">
                    Using variant pricing (base price will be ignored)
                  </div>
                )}
                
                <button
                  type="button"
                  onClick={() => addVariant(true)}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  + Add Variant (Half/Full, Sizes, etc.)
                </button>
              </div>
              
              {/* Variants */}
              {editingItem.variants && editingItem.variants.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Variants
                  </label>
                  <div className="space-y-3">
                    {editingItem.variants.map((variant, index) => (
                      <div key={index} className="flex gap-2 items-center p-3 border border-gray-200 rounded-md">
                        <input
                          type="text"
                          placeholder="Variant name (e.g., Half, Small, 250ml)"
                          value={variant.name}
                          onChange={(e) => updateVariant(index, 'name', e.target.value, true)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="number"
                          placeholder="Price"
                          value={variant.price}
                          onChange={(e) => updateVariant(index, 'price', e.target.value, true)}
                          className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          step="0.01"
                        />
                        <button
                          type="button"
                          onClick={() => removeVariant(index, true)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <select
                value={editingItem.category}
                onChange={(e) => setEditingItem({...editingItem, category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Category *</option>
                {categories.filter(cat => cat.isActive).map((cat) => (
                  <option key={cat.categoryID || cat.name} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
              
              <input
                type="number"
                placeholder="Tax Percentage (%) *"
                value={editingItem.taxPercentage || ''}
                onChange={(e) => setEditingItem({...editingItem, taxPercentage: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                max="100"
                step="0.01"
              />
              
              <input
                type="number"
                placeholder="Preparation Time (minutes)"
                value={editingItem.preparationTime}
                onChange={(e) => setEditingItem({...editingItem, preparationTime: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <div className="flex items-center gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingItem.isSpecialItem || false}
                    onChange={(e) => setEditingItem({...editingItem, isSpecialItem: e.target.checked})}
                    className="mr-2"
                  />
                  Special Item
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingItem.isVegetarian || false}
                    onChange={(e) => setEditingItem({...editingItem, isVegetarian: e.target.checked})}
                    className="mr-2"
                  />
                  Vegetarian
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingItem.isVegan || false}
                    onChange={(e) => setEditingItem({...editingItem, isVegan: e.target.checked})}
                    className="mr-2"
                  />
                  Vegan
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Food Image
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e.target.files[0], true)}
                    className="hidden"
                    id="edit-food-image-upload"
                  />
                  <label
                    htmlFor="edit-food-image-upload"
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 cursor-pointer"
                  >
                    <Upload className="h-4 w-4" />
                    {uploading ? 'Uploading...' : 'Upload Image'}
                  </label>
                  {editingItem.image && (
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600">Image uploaded</span>
                    </div>
                  )}
                </div>
                {editingItem.image && (
                  <div className="mt-2">
                    <img
                      src={editingItem.image}
                      alt="Preview"
                      className="w-20 h-20 object-cover rounded-md"
                    />
                  </div>
                )}
              </div>
              
              {/* Ingredients Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ingredients
                </label>
                <div className="space-y-2">
                  {(editingItem.ingredients || []).map((ingredient, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Enter ingredient"
                        value={ingredient}
                        onChange={(e) => updateIngredient(index, e.target.value, true)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => removeIngredient(index, true)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addIngredient(true)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    + Add Ingredient
                  </button>
                </div>
              </div>
              
              {/* Allergens Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Allergens
                </label>
                <div className="space-y-2">
                  {(editingItem.allergens || []).map((allergen, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Enter allergen"
                        value={allergen}
                        onChange={(e) => updateAllergen(index, e.target.value, true)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => removeAllergen(index, true)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addAllergen(true)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    + Add Allergen
                  </button>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={updateMenuItem}
                disabled={uploading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                Update Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuComponent;
