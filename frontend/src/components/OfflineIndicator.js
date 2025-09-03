import React from 'react';
import { WifiIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { usePWA } from '../hooks/usePWA';

const OfflineIndicator = () => {
  const { isOnline } = usePWA();

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed top-16 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-40">
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 shadow-sm">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              You're offline
            </p>
            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
              Some features may be limited. Data will sync when you're back online.
            </p>
          </div>
          <div className="ml-3 flex-shrink-0">
            <WifiIcon className="h-5 w-5 text-yellow-400 opacity-50" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfflineIndicator;