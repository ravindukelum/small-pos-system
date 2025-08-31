import React from 'react';

const PrintInvoice = ({ sale, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const calculateTax = () => {
    const subtotal = parseFloat(sale.total_amount) / (1 + (sale.tax_rate || 0) / 100);
    return parseFloat(sale.total_amount) - subtotal;
  };

  const getSubtotal = () => {
    return parseFloat(sale.total_amount) - calculateTax() - (sale.discount_amount || 0);
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
          }
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
          }
          .no-print {
            display: none !important;
          }
          .receipt {
            width: 80mm;
            max-width: 80mm;
            margin: 0 auto;
            padding: 5mm;
            font-family: 'Courier New', monospace;
            font-size: 11px;
            line-height: 1.2;
            color: black;
            background: white;
          }
          .receipt h1 {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 2px;
          }
          .receipt .dashed-line {
            border-bottom: 1px dashed #000;
            margin: 3px 0;
          }
          .receipt .total-line {
            font-weight: bold;
            font-size: 12px;
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
          <div className="print-area">
            <div className="receipt bg-white p-4 border border-gray-200 rounded">
              {/* Header */}
              <div className="text-center mb-4">
                <h1 className="text-lg font-bold">SMALL POS SYSTEM</h1>
                <p className="text-sm">Point of Sale Receipt</p>
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
                {sale.items_summary && (
                  <div className="text-sm">
                    <div className="mb-1">{sale.items_summary}</div>
                    <div className="text-xs text-gray-600">({sale.item_count} item(s))</div>
                  </div>
                )}
              </div>

              <div className="dashed-line border-b border-dashed border-gray-400 my-2"></div>

              {/* Totals */}
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>RS {getSubtotal().toFixed(2)}</span>
                </div>
                
                {sale.tax_rate > 0 && (
                  <div className="flex justify-between">
                    <span>Tax ({sale.tax_rate}%):</span>
                    <span>RS {calculateTax().toFixed(2)}</span>
                  </div>
                )}
                
                {sale.discount_amount > 0 && (
                  <div className="flex justify-between">
                    <span>Discount:</span>
                    <span>-RS {parseFloat(sale.discount_amount).toFixed(2)}</span>
                  </div>
                )}
                
                <div className="dashed-line border-b border-dashed border-gray-400 my-1"></div>
                
                <div className="total-line flex justify-between font-bold text-base">
                  <span>TOTAL:</span>
                  <span>RS {parseFloat(sale.total_amount).toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Paid:</span>
                  <span>RS {parseFloat(sale.paid_amount).toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between font-bold">
                  <span>Balance:</span>
                  <span className={parseFloat(sale.total_amount) - parseFloat(sale.paid_amount) > 0 ? 'text-red-600' : 'text-green-600'}>
                    RS {(parseFloat(sale.total_amount) - parseFloat(sale.paid_amount)).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="dashed-line border-b border-dashed border-gray-400 my-3"></div>

              {/* Footer */}
              <div className="text-center text-xs text-gray-600">
                <p>Thank you for your business!</p>
                <p>Status: {sale.status.toUpperCase()}</p>
                <p className="mt-2">Powered by Small POS System</p>
              </div>
            </div>
          </div>

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