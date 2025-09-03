import React, { useState, useRef } from 'react';
import QRCode from 'react-qr-code';
import { QrCodeIcon, DocumentDuplicateIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const QRCodeGenerator = ({ product, size = 200, showControls = true }) => {
  const [qrSize, setQrSize] = useState(size);
  const qrRef = useRef(null);

  // Generate QR code data with product information
  const generateQRData = () => {
    if (!product) return '';
    
    const qrData = {
      type: 'product',
      id: product.id,
      sku: product.sku,
      name: product.item_name,
      price: product.sell_price,
      barcode: product.barcode || product.sku,
      timestamp: new Date().toISOString()
    };
    
    return JSON.stringify(qrData);
  };

  const qrValue = generateQRData();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(qrValue);
      toast.success('QR code data copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy QR code data');
    }
  };

  const downloadQRCode = () => {
    try {
      const svg = qrRef.current?.querySelector('svg');
      if (!svg) {
        toast.error('QR code not found');
        return;
      }

      // Create a canvas to convert SVG to image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const data = new XMLSerializer().serializeToString(svg);
      const DOMURL = window.URL || window.webkitURL || window;
      
      const img = new Image();
      const svgBlob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
      const url = DOMURL.createObjectURL(svgBlob);
      
      img.onload = () => {
        canvas.width = qrSize;
        canvas.height = qrSize;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, qrSize, qrSize);
        DOMURL.revokeObjectURL(url);
        
        // Download the image
        const link = document.createElement('a');
        link.download = `qr-code-${product?.sku || 'product'}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        toast.success('QR code downloaded!');
      };
      
      img.src = url;
    } catch (err) {
      console.error('Download failed:', err);
      toast.error('Failed to download QR code');
    }
  };

  if (!product) {
    return (
      <div className="flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="text-center">
          <QrCodeIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">No product selected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <QrCodeIcon className="h-5 w-5 text-indigo-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Product QR Code
          </h3>
        </div>
        {showControls && (
          <div className="flex space-x-2">
            <button
              onClick={copyToClipboard}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              title="Copy QR data"
            >
              <DocumentDuplicateIcon className="h-4 w-4" />
            </button>
            <button
              onClick={downloadQRCode}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              title="Download QR code"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
        <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">
          {product.item_name}
        </h4>
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p>SKU: {product.sku}</p>
          <p>Price: RS {product.sell_price}</p>
          {product.barcode && <p>Barcode: {product.barcode}</p>}
        </div>
      </div>

      {/* QR Code */}
      <div className="flex justify-center mb-4" ref={qrRef}>
        <div className="p-4 bg-white rounded-lg shadow-sm">
          <QRCode
            value={qrValue}
            size={qrSize}
            level="M"
            includeMargin={true}
          />
        </div>
      </div>

      {/* Size Control */}
      {showControls && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              QR Code Size: {qrSize}px
            </label>
            <input
              type="range"
              min="100"
              max="400"
              step="50"
              value={qrSize}
              onChange={(e) => setQrSize(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>100px</span>
              <span>400px</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={copyToClipboard}
              className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
              Copy Data
            </button>
            <button
              onClick={downloadQRCode}
              className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Download
            </button>
          </div>
        </div>
      )}

      {/* QR Data Preview */}
      {showControls && (
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            QR Code Data:
          </p>
          <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap break-all">
            {JSON.stringify(JSON.parse(qrValue), null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default QRCodeGenerator;