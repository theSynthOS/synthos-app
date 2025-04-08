import React from 'react';

export const MaintenanceBanner = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-purple-700/30 backdrop-blur-md w-[100vw] h-[80vh] flex items-center justify-center rounded-3xl">
        <div className="text-center max-w-3xl mx-4">
          <p className="text-white text-2xl md:text-4xl lg:text-5xl font-medium leading-relaxed">
            🚧 We're currently enhancing your experience! 
            <br className=" " />
            <br className="" />
            Stay tuned for V2 - coming soon with exciting new features. 🌟
          </p>
        </div>
      </div>
    </div>
  );
}; 