import React, { useState, useEffect } from 'react';
import { settingsAPI, salesAPI } from '../services/api';

const PrintInvoice = ({ sale, onClose }) => {
  const [settings, setSettings] = useState(null);
  const [saleDetails, setSaleDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch settings
        const settingsResponse = await settingsAPI.getSettings();
        setSettings(settingsResponse.data);
        
        // Fetch detailed sale information with items
        const saleResponse = await salesAPI.getById(sale.id);
        setSaleDetails(saleResponse.data.sale);
      } catch (error) {
        console.error('Error fetching data:', error);
        // Use default settings if API fails
        setSettings({
          shopName: 'SMALL POS SYSTEM',
          shopPhone: '',
          shopEmail: '',
          shopAddress: '',
          currency: 'RS',
          warrantyPeriod: 30,
          warrantyTerms: 'Standard warranty terms apply.',
          receiptFooter: 'Thank you for your business!'
        });
        setSaleDetails(sale);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sale]);
  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getSubtotal = () => {
    if (saleDetails?.items && saleDetails.items.length > 0) {
      return saleDetails.items.reduce((sum, item) => sum + parseFloat(item.line_total), 0);
    }
    return parseFloat(sale.subtotal || sale.total_amount) - (sale.discount_amount || 0);
  };

  const calculateTax = () => {
    if (saleDetails?.tax_amount !== undefined) {
      return parseFloat(saleDetails.tax_amount);
    }
    const subtotal = getSubtotal();
    return subtotal * ((sale.tax_rate || 0) / 100);
  };

  return (
    <>
      {/* Print Styles */}
      <style>{`
        @media print {
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.3;
            color: black;
            background: white;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
          .print-area {
            display: block !important;
            position: static !important;
            width: 100% !important;
            background: white !important;
            color: black !important;
          }
          .receipt {
            width: 100%;
            max-width: none;
            margin: 0;
            padding: 8px;
            font-family: 'Courier New', monospace;
            font-size: 11px;
            line-height: 1.2;
            color: black;
            background: white;
            position: relative;
          }
          .receipt h1 {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .receipt .dashed-line {
            border-bottom: 1px dashed #000;
            margin: 5px 0;
          }
          .receipt .total-line {
            font-weight: bold;
            font-size: 16px;
          }
          .receipt table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }
          .receipt th, .receipt td {
            font-size: 10px;
            padding: 1px;
            vertical-align: top;
          }
          .receipt th:nth-child(1), .receipt td:nth-child(1) {
            width: 45%;
            text-align: left;
          }
          .receipt th:nth-child(2), .receipt td:nth-child(2) {
            width: 12%;
            text-align: center;
          }
          .receipt th:nth-child(3), .receipt td:nth-child(3) {
            width: 21%;
            text-align: right;
          }
          .receipt th:nth-child(4), .receipt td:nth-child(4) {
            width: 22%;
            text-align: right;
          }
          .receipt img {
            max-height: 50px;
            max-width: 100px;
            object-fit: contain;
            margin: 0 auto 8px auto;
            display: block;
          }
          .receipt .watermark {
            position: absolute !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) rotate(-45deg) !important;
            opacity: 0.15 !important;
            z-index: 1 !important;
            pointer-events: none !important;
            max-width: 150px !important;
            max-height: 150px !important;
            display: block !important;
          }
          .receipt .text-watermark {
            font-size: 24px !important;
            font-weight: bold !important;
            color: #000 !important;
            white-space: nowrap !important;
            text-align: center !important;
          }
          .receipt .content {
            position: relative;
            z-index: 10;
          }
          .receipt .flex {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin: 1px 0;
          }
          .receipt .flex span:first-child {
            flex: 1;
            text-align: left;
          }
          .receipt .flex span:last-child {
            flex: 0 0 auto;
            text-align: right;
            margin-left: 8px;
            white-space: nowrap;
          }
        }
      `}</style>

      {/* Modal Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 no-print">
        <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4 no-print">
            <h2 className="text-xl font-bold text-gray-900">Print Invoice</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          {/* Print Preview */}
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading settings...</span>
            </div>
          ) : (
          <div className="print-area">
            <div className="receipt bg-white p-4 border border-gray-200 rounded">
              {/* Watermark */}
              {settings?.shopLogoUrl ? (
                <img 
                  src={settings.shopLogoUrl} 
                  alt="Watermark" 
                  className="watermark"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="watermark text-watermark">
                  {settings?.shopName || 'INVOICE'}
                </div>
              )}
              
              <div className="content">
                {/* Header */}
                <div className="text-center mb-4">
                  <h1 className="text-xl font-bold mb-2">INVOICE</h1>
                {settings?.shopLogoUrl && (
                  <div className="mb-2">
                    <img 
                      src={settings.shopLogoUrl} 
                      alt="Shop Logo" 
                      className="mx-auto max-h-16 max-w-32 object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <h2 className="text-lg font-bold">{settings?.shopName || 'SMALL POS SYSTEM'}</h2>
                {settings?.shopPhone && (
                  <p className="text-xs">Phone: {settings.shopPhone}</p>
                )}
                {settings?.shopEmail && (
                  <p className="text-xs">Email: {settings.shopEmail}</p>
                )}
                {settings?.shopAddress && (
                  <p className="text-xs">{settings.shopAddress}</p>
                )}
                {(settings?.shopCity || settings?.shopState) && (
                  <p className="text-xs">
                    {settings.shopCity}{settings.shopCity && settings.shopState ? ', ' : ''}{settings.shopState}
                  </p>
                )}
                <p className="text-sm mt-1">Point of Sale Receipt</p>
                <div className="dashed-line border-b border-dashed border-gray-400 my-2"></div>
              </div>

              {/* Invoice Details */}
              <div className="mb-4 text-sm">
                <div className="flex justify-between">
                  <span>Invoice:</span>
                  <span className="font-mono">{sale.invoice}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>{formatDate(sale.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span>{sale.customer_name || 'Walk-in Customer'}</span>
                </div>
                {sale.customer_phone && (
                  <div className="flex justify-between">
                    <span>Phone:</span>
                    <span>{sale.customer_phone}</span>
                  </div>
                )}
              </div>

              <div className="dashed-line border-b border-dashed border-gray-400 my-2"></div>

              {/* Items */}
              <div className="mb-4">
                <div className="text-sm font-bold mb-2">ITEMS:</div>

                {saleDetails?.items && saleDetails.items.length > 0 ? (
                  <div className="text-xs">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-gray-300">
                          <th className="text-left py-1 text-xs">Item</th>
                          <th className="text-center py-1 text-xs">Qty</th>
                          <th className="text-right py-1 text-xs">Price</th>
                          <th className="text-right py-1 text-xs">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {saleDetails.items.map((item, index) => (
                          <tr key={index} className="border-b border-gray-100">
                            <td className="py-1 text-xs">{item.item_name}</td>
                            <td className="text-center py-1 text-xs">{item.quantity}</td>
                            <td className="text-right py-1 text-xs">{settings?.currency || 'RS'} {parseFloat(item.unit_price).toFixed(2)}</td>
                            <td className="text-right py-1 text-xs">{settings?.currency || 'RS'} {parseFloat(item.line_total).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="text-xs text-gray-600 mt-1">({saleDetails.items.length} item(s))</div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">No items found</div>
                )}
              </div>

              <div className="dashed-line border-b border-dashed border-gray-400 my-2"></div>

              {/* Totals */}
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{settings?.currency || 'RS'} {getSubtotal().toFixed(2)}</span>
                </div>
                
                {sale.tax_rate > 0 && (
                  <div className="flex justify-between">
                    <span>Tax ({sale.tax_rate}%):</span>
                    <span>{settings?.currency || 'RS'} {calculateTax().toFixed(2)}</span>
                  </div>
                )}
                
                {sale.discount_amount > 0 && (
                  <div className="flex justify-between">
                    <span>Discount:</span>
                    <span>-{settings?.currency || 'RS'} {parseFloat(sale.discount_amount).toFixed(2)}</span>
                  </div>
                )}
                
                <div className="dashed-line border-b border-dashed border-gray-400 my-1"></div>
                
                <div className="total-line flex justify-between font-bold text-base">
                  <span>TOTAL:</span>
                  <span>{settings?.currency || 'RS'} {parseFloat(sale.total_amount).toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Paid:</span>
                  <span>{settings?.currency || 'RS'} {parseFloat(sale.paid_amount).toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between font-bold">
                  <span>Balance:</span>
                  <span className={parseFloat(sale.total_amount) - parseFloat(sale.paid_amount) > 0 ? 'text-red-600' : 'text-green-600'}>
                    {settings?.currency || 'RS'} {(parseFloat(sale.total_amount) - parseFloat(sale.paid_amount)).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="dashed-line border-b border-dashed border-gray-400 my-3"></div>

              {/* Footer */}
              <div className="text-center text-xs text-gray-600">
                <p>{settings?.receiptFooter || 'Thank you for your business!'}</p>
                <p>Status: {sale.status.toUpperCase()}</p>
                {settings?.warrantyPeriod && (
                  <div className="mt-2">
                    <p>Warranty: {settings.warrantyPeriod} days</p>
                    {settings.warrantyTerms && (
                      <p className="text-xs mt-1">{settings.warrantyTerms}</p>
                    )}
                  </div>
                )}
                <p className="mt-2">Powered by {settings?.shopName || 'Small POS System'}</p>
              </div>
              </div>
            </div>
          </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4 no-print">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Receipt
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default PrintInvoice;