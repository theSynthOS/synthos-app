import React from 'react';

export const MaintenanceBanner = () => {
  return (
    <div className="w-full bg-purple-700/30 backdrop-blur-md">
      <div className="container mx-auto px-4 py-1">
        <div className="flex items-center justify-center text-center">
          <p className="text-white text-sm sm:text-base md:text-lg font-medium">
            🚧 We're currently enhancing your experience! Stay tuned for V2 - coming soon with exciting new features. 🌟
          </p>
        </div>
      </div>
    </div>
  );
};