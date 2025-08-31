import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  TrashIcon, 
  ShoppingCartIcon,
  PrinterIcon,
  XMarkIcon,
  MinusIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { salesAPI, inventoryAPI } from '../services/api';
import PrintInvoice from '../components/PrintInvoice';

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  
  // Cart state for new invoice
  const [cart, setCart] = useState([]);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: ''
  });
  const [invoiceSettings, setInvoiceSettings] = useState({
    taxRate: 0,
    discountAmount: 0,
    paidAmount: 0
  });
  
  // Payment modal state
  const [paymentAmount, setPaymentAmount] = useState(0);

  useEffect(() => {
    fetchSales();
    fetchInventory();
  }, []);

  const fetchSales = async () => {
    try {
      const response = await salesAPI.getAll();
      setSales(response.data.sales);
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    try {
      const response = await inventoryAPI.getAll();
      setInventory(response.data.inventory);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  const addToCart = (item) => {
    const existingItem = cart.find(cartItem => cartItem.item_id === item.id);
    
    if (existingItem) {
      if (existingItem.quantity < item.quantity) {
        setCart(cart.map(cartItem => 
          cartItem.item_id === item.id 
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        ));
      } else {
        alert(`Only ${item.quantity} units available in stock`);
      }
    } else {
      if (item.quantity > 0) {
        setCart([...cart, {
          item_id: item.id,
          item_name: item.item_name,
          sku: item.sku,
          unit_price: item.sell_price,
          quantity: 1,
          max_quantity: item.quantity
        }]);
      } else {
        alert('Item is out of stock');
      }
    }
  };

  const updateCartQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    
    const item = cart.find(cartItem => cartItem.item_id === itemId);
    if (newQuantity > item.max_quantity) {
      alert(`Only ${item.max_quantity} units available in stock`);
      return;
    }
    
    setCart(cart.map(cartItem => 
      cartItem.item_id === itemId 
        ? { ...cartItem, quantity: newQuantity }
        : cartItem
    ));
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(cartItem => cartItem.item_id !== itemId));
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    const taxAmount = subtotal * (invoiceSettings.taxRate / 100);
    const total = subtotal + taxAmount - invoiceSettings.discountAmount;
    
    return {
      subtotal: subtotal.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      total: total.toFixed(2)
    };
  };

  const handleCreateSale = async () => {
    if (cart.length === 0) {
      alert('Please add items to cart');
      return;
    }

    try {
      const totals = calculateTotals();
      const saleData = {
        items: cart,
        customer_name: customerInfo.name,
        customer_phone: customerInfo.phone,
        tax_rate: invoiceSettings.taxRate,
        discount_amount: invoiceSettings.discountAmount,
        paid_amount: invoiceSettings.paidAmount
      };

      await salesAPI.create(saleData);
      
      // Reset form
      setCart([]);
      setCustomerInfo({ name: '', phone: '' });
      setInvoiceSettings({ taxRate: 0, discountAmount: 0, paidAmount: 0 });
      setShowModal(false);
      
      fetchSales();
      fetchInventory(); // Refresh inventory to show updated quantities
      alert('Sale created successfully!');
    } catch (error) {
      console.error('Error creating sale:', error);
      alert('Error creating sale: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleUpdatePayment = async () => {
    try {
      await salesAPI.updatePayment(selectedSale.id, { paid_amount: paymentAmount });
      setShowPaymentModal(false);
      setSelectedSale(null);
      setPaymentAmount(0);
      fetchSales();
      alert('Payment updated successfully!');
    } catch (error) {
      console.error('Error updating payment:', error);
      alert('Error updating payment: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteSale = async (id) => {
    if (window.confirm('Are you sure you want to delete this sale?')) {
      try {
        await salesAPI.delete(id);
        fetchSales();
        fetchInventory(); // Refresh inventory to show restored quantities
        alert('Sale deleted successfully!');
      } catch (error) {
        console.error('Error deleting sale:', error);
        alert('Error deleting sale: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const openPaymentModal = (sale) => {
    setSelectedSale(sale);
    setPaymentAmount(parseFloat(sale.paid_amount));
    setShowPaymentModal(true);
  };

  const openPrintModal = (sale) => {
    setSelectedSale(sale);
    setShowPrintModal(true);
  };

  const filteredSales = sales.filter(sale => {
    const matchesSearch = sale.invoice.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (sale.customer_name && sale.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (sale.items_summary && sale.items_summary.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || sale.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredInventory = inventory.filter(item => 
    item.item_name.toLowerCase().includes(itemSearchTerm.toLowerCase()) ||
    item.sku.toLowerCase().includes(itemSearchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const statusClasses = {
      paid: 'bg-green-100 text-green-800',
      unpaid: 'bg-red-100 text-red-800',
      partial: 'bg-yellow-100 text-yellow-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusClasses[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const totals = calculateTotals();

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
        <h1 className="text-2xl font-bold text-gray-900">Sales Management</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          New Sale
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by invoice, customer, or items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
          <option value="partial">Partial</option>
        </select>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredSales.map((sale) => (
              <tr key={sale.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {sale.invoice}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(sale.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>
                    <div className="font-medium">{sale.customer_name || 'Walk-in Customer'}</div>
                    {sale.customer_phone && (
                      <div className="text-xs text-gray-400">{sale.customer_phone}</div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  <div className="max-w-xs truncate" title={sale.items_summary}>
                    {sale.item_count} item(s): {sale.items_summary}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                  RS {parseFloat(sale.total_amount).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  RS {parseFloat(sale.paid_amount).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(sale.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => openPrintModal(sale)}
                    className="text-blue-600 hover:text-blue-900"
                    title="Print Invoice"
                  >
                    <PrinterIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => openPaymentModal(sale)}
                    className="text-primary-600 hover:text-primary-900"
                    title="Update Payment"
                  >
                    <CurrencyDollarIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteSale(sale.id)}
                    className="text-red-600 hover:text-red-900"
                    title="Delete Sale"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredSales.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No sales found matching your criteria.
          </div>
        )}
      </div>

      {/* New Sale Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Create New Sale</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Inventory */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Available Items</h3>
                
                {/* Item Search */}
                <div className="relative mb-4">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search items..."
                    value={itemSearchTerm}
                    onChange={(e) => setItemSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full"
                  />
                </div>

                {/* Items List */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredInventory.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <div className="font-medium">{item.item_name}</div>
                        <div className="text-sm text-gray-500">SKU: {item.sku}</div>
                        <div className="text-sm text-gray-500">Stock: {item.quantity}</div>
                        <div className="text-sm font-medium text-green-600">RS {item.sell_price}</div>
                      </div>
                      <button
                        onClick={() => addToCart(item)}
                        disabled={item.quantity === 0}
                        className="bg-primary-600 text-white px-3 py-1 rounded hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        <PlusIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column - Cart & Invoice */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <ShoppingCartIcon className="h-5 w-5" />
                  Cart ({cart.length} items)
                </h3>

                {/* Customer Information */}
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Customer Information</h4>
                  <div className="grid grid-cols-1 gap-2">
                    <input
                      type="text"
                      placeholder="Customer Name (Optional)"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                      className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="Phone Number (Optional)"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                      className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Cart Items */}
                <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.item_id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{item.item_name}</div>
                        <div className="text-sm text-gray-500">
                          <input
                            type="number"
                            value={item.unit_price}
                            onChange={(e) => {
                              const newPrice = parseFloat(e.target.value) || 0;
                              setCart(cart.map(cartItem => 
                                cartItem.item_id === item.item_id 
                                  ? { ...cartItem, unit_price: newPrice }
                                  : cartItem
                              ));
                            }}
                            className="w-20 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            step="0.01"
                            min="0"
                          /> RS each
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateCartQuantity(item.item_id, item.quantity - 1)}
                          className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                        >
                          <MinusIcon className="h-4 w-4" />
                        </button>
                        <span className="w-12 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(item.item_id, item.quantity + 1)}
                          className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600"
                        >
                          <PlusIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.item_id)}
                          className="text-red-500 hover:text-red-700 ml-2"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="text-right ml-4">
                        <div className="font-medium">RS {(item.unit_price * item.quantity).toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                  
                  {cart.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      Cart is empty. Add items from the left panel.
                    </div>
                  )}
                </div>

                {/* Invoice Settings */}
                {cart.length > 0 && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Invoice Settings</h4>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Tax Rate (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={invoiceSettings.taxRate}
                          onChange={(e) => setInvoiceSettings({...invoiceSettings, taxRate: parseFloat(e.target.value) || 0})}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Discount (RS)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={invoiceSettings.discountAmount}
                          onChange={(e) => setInvoiceSettings({...invoiceSettings, discountAmount: parseFloat(e.target.value) || 0})}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Paid Amount (RS)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={invoiceSettings.paidAmount}
                          onChange={(e) => setInvoiceSettings({...invoiceSettings, paidAmount: parseFloat(e.target.value) || 0})}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Totals */}
                {cart.length > 0 && (
                  <div className="mb-4 p-4 bg-primary-50 rounded-lg">
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>RS {totals.subtotal}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Tax ({invoiceSettings.taxRate}%):</span>
                        <span>RS {totals.taxAmount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Discount:</span>
                        <span>-RS {invoiceSettings.discountAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t pt-1">
                        <span>Total:</span>
                        <span>RS {totals.total}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Paid:</span>
                        <span>RS {invoiceSettings.paidAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-medium">
                        <span>Balance:</span>
                        <span className={parseFloat(totals.total) - invoiceSettings.paidAmount > 0 ? 'text-red-600' : 'text-green-600'}>
                          RS {(parseFloat(totals.total) - invoiceSettings.paidAmount).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateSale}
                    disabled={cart.length === 0}
                    className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Create Sale
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Update Payment</h2>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invoice: {selectedSale.invoice}
                </label>
                <div className="text-sm text-gray-500">
                  Total Amount: RS {parseFloat(selectedSale.total_amount).toFixed(2)}
                </div>
                <div className="text-sm text-gray-500">
                  Current Paid: RS {parseFloat(selectedSale.paid_amount).toFixed(2)}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Paid Amount
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdatePayment}
                  className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                >
                  Update Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Modal */}
      {showPrintModal && selectedSale && (
        <PrintInvoice 
          sale={selectedSale} 
          onClose={() => setShowPrintModal(false)} 
        />
      )}
    </div>
  );
};

export default Sales;