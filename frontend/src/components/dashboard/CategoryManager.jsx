import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Save,
  X,
  AlertCircle,
  RefreshCw,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import apiService from '../../lib/api';

const CategoryManager = ({ resID, onCategoryChange }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    image: '',
    sortOrder: 0
  });

  useEffect(() => {
    fetchCategories();
  }, [resID]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await apiService.getCategories(resID);
      setCategories(response.data);
      setError(null);
      if (onCategoryChange) {
        onCategoryChange(response.data);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file, isEditing = false) => {
    if (!file) return;

    try {
      setUploading(true);
      const response = await apiService.uploadImage(resID, file);
      
      if (isEditing) {
        setEditingCategory(prev => ({
          ...prev,
          image: response.data.url
        }));
      } else {
        setNewCategory(prev => ({
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

  const addCategory = async () => {
    try {
      if (!newCategory.name.trim()) {
        alert('Category name is required');
        return;
      }

      const response = await apiService.createCategory(resID, newCategory);
      setCategories(prev => [...prev, response.data]);
      resetForm();
      setShowAddCategory(false);
      if (onCategoryChange) {
        onCategoryChange([...categories, response.data]);
      }
    } catch (err) {
      console.error('Error adding category:', err);
      alert('Failed to add category: ' + err.message);
    }
  };

  const updateCategory = async () => {
    try {
      if (!editingCategory.name.trim()) {
        alert('Category name is required');
        return;
      }

      const response = await apiService.updateCategory(resID, editingCategory.categoryID, editingCategory);
      setCategories(prev =>
        prev.map(cat =>
          cat.categoryID === editingCategory.categoryID ? response.data : cat
        )
      );
      setEditingCategory(null);
      if (onCategoryChange) {
        onCategoryChange(categories.map(cat =>
          cat.categoryID === editingCategory.categoryID ? response.data : cat
        ));
      }
    } catch (err) {
      console.error('Error updating category:', err);
      alert('Failed to update category: ' + err.message);
    }
  };

  const toggleCategoryStatus = async (categoryID) => {
    try {
      await apiService.toggleCategoryStatus(resID, categoryID);
      setCategories(prev =>
        prev.map(cat =>
          cat.categoryID === categoryID ? { ...cat, isActive: !cat.isActive } : cat
        )
      );
    } catch (err) {
      console.error('Error toggling category status:', err);
      alert('Failed to update category status: ' + err.message);
    }
  };

  const deleteCategory = async (categoryID) => {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) return;

    try {
      await apiService.deleteCategory(resID, categoryID);
      setCategories(prev => prev.filter(cat => cat.categoryID !== categoryID));
      if (onCategoryChange) {
        onCategoryChange(categories.filter(cat => cat.categoryID !== categoryID));
      }
    } catch (err) {
      console.error('Error deleting category:', err);
      alert('Failed to delete category: ' + err.message);
    }
  };

  const resetForm = () => {
    setNewCategory({
      name: '',
      description: '',
      image: '',
      sortOrder: 0
    });
  };

  if (loading && categories.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Categories</h3>
          <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-md p-4 animate-pulse">
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Categories Management</h3>
        <div className="flex gap-2">
          <button
            onClick={fetchCategories}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowAddCategory(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Category
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

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <div key={category.categoryID} className="bg-white rounded-lg shadow-md overflow-hidden">
            {category.image && (
              <div className="h-32 bg-gray-200">
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">{category.name}</h4>
                  <p className="text-sm text-gray-600">{category.itemCount || 0} items</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleCategoryStatus(category.categoryID)}
                    className={`p-1 rounded ${category.isActive ? 'text-green-600' : 'text-gray-400'}`}
                    title={category.isActive ? 'Active' : 'Inactive'}
                  >
                    {category.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <button 
                    onClick={() => setEditingCategory(category)}
                    className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => deleteCategory(category.categoryID)}
                    className="p-1 text-red-600 hover:bg-red-100 rounded"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              {category.description && (
                <p className="text-sm text-gray-600 mb-3">{category.description}</p>
              )}
              
              <span className={`px-2 py-1 rounded-full text-xs ${
                category.isActive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {category.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Category Modal */}
      {showAddCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Add Category</h3>
              <button
                onClick={() => {
                  setShowAddCategory(false);
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
                placeholder="Category Name *"
                value={newCategory.name}
                onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <textarea
                placeholder="Description"
                value={newCategory.description}
                onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Image
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e.target.files[0], false)}
                    className="hidden"
                    id="category-image-upload"
                  />
                  <label
                    htmlFor="category-image-upload"
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 cursor-pointer"
                  >
                    <Upload className="h-4 w-4" />
                    {uploading ? 'Uploading...' : 'Upload Image'}
                  </label>
                  {newCategory.image && (
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600">Image uploaded</span>
                    </div>
                  )}
                </div>
                {newCategory.image && (
                  <div className="mt-2">
                    <img
                      src={newCategory.image}
                      alt="Preview"
                      className="w-20 h-20 object-cover rounded-md"
                    />
                  </div>
                )}
              </div>
              
              <input
                type="number"
                placeholder="Sort Order"
                value={newCategory.sortOrder}
                onChange={(e) => setNewCategory({...newCategory, sortOrder: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddCategory(false);
                  resetForm();
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={addCategory}
                disabled={uploading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Edit Category</h3>
              <button
                onClick={() => setEditingCategory(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Category Name *"
                value={editingCategory.name}
                onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <textarea
                placeholder="Description"
                value={editingCategory.description || ''}
                onChange={(e) => setEditingCategory({...editingCategory, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Image
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e.target.files[0], true)}
                    className="hidden"
                    id="edit-category-image-upload"
                  />
                  <label
                    htmlFor="edit-category-image-upload"
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 cursor-pointer"
                  >
                    <Upload className="h-4 w-4" />
                    {uploading ? 'Uploading...' : 'Upload Image'}
                  </label>
                  {editingCategory.image && (
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600">Image uploaded</span>
                    </div>
                  )}
                </div>
                {editingCategory.image && (
                  <div className="mt-2">
                    <img
                      src={editingCategory.image}
                      alt="Preview"
                      className="w-20 h-20 object-cover rounded-md"
                    />
                  </div>
                )}
              </div>
              
              <input
                type="number"
                placeholder="Sort Order"
                value={editingCategory.sortOrder || 0}
                onChange={(e) => setEditingCategory({...editingCategory, sortOrder: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setEditingCategory(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={updateCategory}
                disabled={uploading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                Update Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManager;
