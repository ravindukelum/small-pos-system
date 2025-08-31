import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  PencilIcon, 
  TrashIcon,
  ExclamationTriangleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  XMarkIcon,
  CheckIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { inventoryAPI } from '../services/api';

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [sortBy, setSortBy] = useState('item_name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedItems, setSelectedItems] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  const [formData, setFormData] = useState({
    item_name: '',
    sku: '',
    category: '',
    buy_price: '',
    sell_price: '',
    quantity: '',
    min_stock: '',
    description: '',
    supplier: '',
    barcode: ''
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await inventoryAPI.getAll();
      setInventory(response.data.inventory);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        buy_price: parseFloat(formData.buy_price),
        sell_price: parseFloat(formData.sell_price),
        quantity: parseInt(formData.quantity),
        min_stock: parseInt(formData.min_stock || 0)
      };

      if (editingItem) {
        await inventoryAPI.update(editingItem.id, submitData);
        alert('Item updated successfully!');
      } else {
        await inventoryAPI.create(submitData);
        alert('Item created successfully!');
      }
      
      setShowModal(false);
      resetForm();
      fetchInventory();
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Error saving item: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      item_name: item.item_name,
      sku: item.sku,
      category: item.category || '',
      buy_price: item.buy_price.toString(),
      sell_price: item.sell_price.toString(),
      quantity: item.quantity.toString(),
      min_stock: (item.min_stock || 0).toString(),
      description: item.description || '',
      supplier: item.supplier || '',
      barcode: item.barcode || ''
    });
    setShowModal(true);
  };

  const handleView = (item) => {
    setViewingItem(item);
    setShowViewModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await inventoryAPI.delete(id);
        fetchInventory();
        alert('Item deleted successfully!');
      } catch (error) {
        console.error('Error deleting item:', error);
        alert('Error deleting item: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) {
      alert('Please select items to delete');
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete ${selectedItems.length} selected items?`)) {
      try {
        await Promise.all(selectedItems.map(id => inventoryAPI.delete(id)));
        setSelectedItems([]);
        fetchInventory();
        alert('Selected items deleted successfully!');
      } catch (error) {
        console.error('Error deleting items:', error);
        alert('Error deleting items: ' + error.message);
      }
    }
  };

  const handleSelectItem = (id) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredInventory.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredInventory.map(item => item.id));
    }
  };

  const resetForm = () => {
    setFormData({
      item_name: '',
      sku: '',
      category: '',
      buy_price: '',
      sell_price: '',
      quantity: '',
      min_stock: '',
      description: '',
      supplier: '',
      barcode: ''
    });
    setEditingItem(null);
    setShowModal(false);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getUniqueCategories = () => {
    const categories = inventory.map(item => item.category).filter(Boolean);
    return [...new Set(categories)];
  };

  const filteredInventory = inventory
    .filter(item => {
      const matchesSearch = item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (item.supplier && item.supplier.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      
      const matchesStock = stockFilter === 'all' || 
                          (stockFilter === 'low' && item.quantity <= (item.min_stock || 5)) ||
                          (stockFilter === 'out' && item.quantity === 0) ||
                          (stockFilter === 'in' && item.quantity > 0);
      
      return matchesSearch && matchesCategory && matchesStock;
    })
    .sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const getLowStockItems = () => {
    return inventory.filter(item => item.quantity <= (item.min_stock || 5) && item.quantity > 0);
  };

  const getOutOfStockItems = () => {
    return inventory.filter(item => item.quantity === 0);
  };

  const getTotalValue = () => {
    return inventory.reduce((total, item) => total + (item.quantity * item.buy_price), 0);
  };

  const getStockStatusBadge = (item) => {
    if (item.quantity === 0) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Out of Stock</span>;
    } else if (item.quantity <= (item.min_stock || 5)) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Low Stock</span>;
    } else {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">In Stock</span>;
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? 
      <ArrowUpIcon className="h-4 w-4 inline ml-1" /> : 
      <ArrowDownIcon className="h-4 w-4 inline ml-1" />;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
        <div className="flex gap-2">
          {selectedItems.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
            >
              <TrashIcon className="h-5 w-5" />
              Delete Selected ({selectedItems.length})
            </button>
          )}
          <button
            onClick={() => setShowModal(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Add Item
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{inventory.length}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <div className="w-6 h-6 bg-blue-600 rounded"></div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-yellow-600">{getLowStockItems().length}</p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600">{getOutOfStockItems().length}</p>
            </div>
            <div className="p-2 bg-red-100 rounded-lg">
              <XMarkIcon className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-green-600">RS {getTotalValue().toFixed(2)}</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <div className="w-6 h-6 bg-green-600 rounded"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {(getLowStockItems().length > 0 || getOutOfStockItems().length > 0) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mt-0.5 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Stock Alerts</h3>
              <div className="mt-2 text-sm text-yellow-700">
                {getOutOfStockItems().length > 0 && (
                  <p>{getOutOfStockItems().length} items are out of stock</p>
                )}
                {getLowStockItems().length > 0 && (
                  <p>{getLowStockItems().length} items are running low</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, SKU, category, or supplier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full"
          />
        </div>
        
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="all">All Categories</option>
          {getUniqueCategories().map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
        
        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="all">All Stock Levels</option>
          <option value="in">In Stock</option>
          <option value="low">Low Stock</option>
          <option value="out">Out of Stock</option>
        </select>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedItems.length === filteredInventory.length && filteredInventory.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('item_name')}
              >
                Item Name {getSortIcon('item_name')}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('sku')}
              >
                SKU {getSortIcon('sku')}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('category')}
              >
                Category {getSortIcon('category')}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('quantity')}
              >
                Stock {getSortIcon('quantity')}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('buy_price')}
              >
                Buy Price {getSortIcon('buy_price')}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('sell_price')}
              >
                Sell Price {getSortIcon('sell_price')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredInventory.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => handleSelectItem(item.id)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{item.item_name}</div>
                    {item.description && (
                      <div className="text-sm text-gray-500 truncate max-w-xs" title={item.description}>
                        {item.description}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.sku}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.category || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{item.quantity}</div>
                  {item.min_stock && (
                    <div className="text-xs text-gray-500">Min: {item.min_stock}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  RS {parseFloat(item.buy_price).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  RS {parseFloat(item.sell_price).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStockStatusBadge(item)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => handleView(item)}
                    className="text-blue-600 hover:text-blue-900"
                    title="View Details"
                  >
                    <EyeIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleEdit(item)}
                    className="text-primary-600 hover:text-primary-900"
                    title="Edit Item"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-red-600 hover:text-red-900"
                    title="Delete Item"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredInventory.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No items found matching your criteria.
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingItem ? 'Edit Item' : 'Add New Item'}
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.item_name}
                    onChange={(e) => setFormData({...formData, item_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SKU *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({...formData, sku: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier
                  </label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Buy Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.buy_price}
                    onChange={(e) => setFormData({...formData, buy_price: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sell Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.sell_price}
                    onChange={(e) => setFormData({...formData, sell_price: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.min_stock}
                    onChange={(e) => setFormData({...formData, min_stock: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Barcode
                  </label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                >
                  {editingItem ? 'Update Item' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Item Details</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Item Name</label>
                  <p className="mt-1 text-sm text-gray-900">{viewingItem.item_name}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">SKU</label>
                  <p className="mt-1 text-sm text-gray-900">{viewingItem.sku}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <p className="mt-1 text-sm text-gray-900">{viewingItem.category || '-'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Supplier</label>
                  <p className="mt-1 text-sm text-gray-900">{viewingItem.supplier || '-'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Buy Price</label>
                  <p className="mt-1 text-sm text-gray-900">RS {parseFloat(viewingItem.buy_price).toFixed(2)}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Sell Price</label>
                  <p className="mt-1 text-sm text-gray-900">RS {parseFloat(viewingItem.sell_price).toFixed(2)}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Current Stock</label>
                  <p className="mt-1 text-sm text-gray-900">{viewingItem.quantity}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Minimum Stock</label>
                  <p className="mt-1 text-sm text-gray-900">{viewingItem.min_stock || '-'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1">{getStockStatusBadge(viewingItem)}</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Profit Margin</label>
                  <p className="mt-1 text-sm text-gray-900">
                    RS {(viewingItem.sell_price - viewingItem.buy_price).toFixed(2)} 
                    ({(((viewingItem.sell_price - viewingItem.buy_price) / viewingItem.buy_price) * 100).toFixed(1)}%)
                  </p>
                </div>
                
                {viewingItem.barcode && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Barcode</label>
                    <p className="mt-1 text-sm text-gray-900">{viewingItem.barcode}</p>
                  </div>
                )}
                
                {viewingItem.description && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <p className="mt-1 text-sm text-gray-900">{viewingItem.description}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleEdit(viewingItem);
                  }}
                  className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                >
                  Edit Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;