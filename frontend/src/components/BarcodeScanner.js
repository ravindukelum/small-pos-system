import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { XMarkIcon, CameraIcon } from '@heroicons/react/24/outline';

const BarcodeScanner = ({ onScan, onClose, isOpen }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [isInitializing, setIsInitializing] = useState(false);
  const scannerRef = useRef(null);
  const html5QrcodeScannerRef = useRef(null);

  useEffect(() => {
    // Only cleanup when component unmounts or modal closes
    return () => {
      cleanupScanner();
    };
  }, []);

  const cleanupScanner = () => {
    if (html5QrcodeScannerRef.current) {
      try {
        html5QrcodeScannerRef.current.clear().catch(console.error);
      } catch (err) {
        console.error('Error cleaning up scanner:', err);
      }
      html5QrcodeScannerRef.current = null;
    }
  };

  const initializeScanner = async () => {
    if (html5QrcodeScannerRef.current) {
      cleanupScanner();
    }

    setIsInitializing(true);
    setError('');

    try {
      // Check if camera is available
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      if (videoDevices.length === 0) {
        throw new Error('No camera found on this device');
      }

      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop()); // Stop the test stream

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        formatsToSupport: [
          'CODE_128',
          'CODE_39',
          'EAN_13',
          'EAN_8',
          'UPC_A',
          'UPC_E',
          'QR_CODE'
        ],
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true
      };

      html5QrcodeScannerRef.current = new Html5QrcodeScanner(
        'barcode-scanner-container',
        config,
        false
      );

      html5QrcodeScannerRef.current.render(
        (decodedText, decodedResult) => {
          console.log('Barcode scanned:', decodedText);
          setIsScanning(false);
          onScan(decodedText, decodedResult);
          handleClose();
        },
        (error) => {
          // Handle scan errors silently for better UX
          console.warn('Scan error:', error);
        }
      );

      setIsScanning(true);
      setIsInitializing(false);
    } catch (err) {
      console.error('Scanner initialization error:', err);
      setIsInitializing(false);
      
      let errorMessage = 'Failed to initialize camera.';
      
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Camera access denied. Please allow camera permissions and try again.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device.';
      } else if (err.name === 'NotSupportedError') {
        errorMessage = 'Camera not supported on this browser.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    }
  };

  const handleClose = () => {
    cleanupScanner();
    setIsScanning(false);
    setError('');
    setIsInitializing(false);
    onClose();
  };

  const handleRetry = () => {
    setError('');
    initializeScanner();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <CameraIcon className="h-6 w-6 text-indigo-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Scan Barcode
              </h3>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Scanner container */}
          <div className="mb-4">
            {isInitializing ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Initializing camera...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <div className="text-red-600 dark:text-red-400 mb-4">
                  {error}
                </div>
                <button
                  onClick={handleRetry}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div>
                {!isScanning ? (
                  <div className="text-center py-8">
                    <button
                      onClick={initializeScanner}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <CameraIcon className="h-5 w-5 mr-2" />
                      Start Camera
                    </button>
                  </div>
                ) : (
                  <div className="text-center mt-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Position the barcode within the scanning area
                    </p>
                  </div>
                )}
                <div 
                  id="barcode-scanner-container" 
                  ref={scannerRef}
                  className="w-full"
                  style={{ display: isScanning ? 'block' : 'none' }}
                />
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">Instructions:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Allow camera access when prompted</li>
                <li>Hold the barcode steady within the frame</li>
                <li>Ensure good lighting for best results</li>
                <li>Supports most common barcode formats</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;