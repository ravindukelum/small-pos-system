import React, { useState } from 'react';
import { XMarkIcon, ArrowDownTrayIcon, ShareIcon } from '@heroicons/react/24/outline';
import { usePWA } from '../hooks/usePWA';

const InstallPrompt = () => {
  const { isInstallable, isInstalled, installApp, shareApp } = usePWA();
  const [isVisible, setIsVisible] = useState(true);
  const [isInstalling, setIsInstalling] = useState(false);

  if (!isInstallable || isInstalled || !isVisible) {
    return null;
  }

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      const success = await installApp();
      if (success) {
        setIsVisible(false);
      }
    } catch (error) {
      console.error('Installation failed:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleShare = async () => {
    const success = await shareApp();
    if (!success) {
      // Fallback to copying URL
      try {
        await navigator.clipboard.writeText(window.location.origin);
        // You could show a toast here
      } catch (error) {
        console.error('Failed to copy URL:', error);
      }
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Store dismissal in localStorage to prevent showing again for a while
    localStorage.setItem('install-prompt-dismissed', Date.now().toString());
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              Install POS System
            </h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Install this app for a better experience with offline access and faster loading.
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="ml-2 flex-shrink-0 p-1 rounded-md text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
        
        <div className="mt-3 flex space-x-2">
          <button
            onClick={handleInstall}
            disabled={isInstalling}
            className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
            {isInstalling ? 'Installing...' : 'Install'}
          </button>
          
          <button
            onClick={handleShare}
            className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors touch-manipulation"
          >
            <ShareIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;