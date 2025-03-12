import React from "react";

interface ModalProps {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ onClose, title, children }) => {
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-[#09092f] p-6 rounded-lg w-[90%] md:w-[80%] h-[80vh] shadow-lg relative overflow-hidden flex flex-col border border-gray-700">
        <button
          className="absolute top-4 right-4 text-gray-300 hover:text-yellow-200 text-2xl font-bold cursor-pointer transition-all duration-200 hover:scale-125"
          onClick={onClose}
        >
          ×
        </button>
        <h2 className="text-[2rem] font-bold mb-4 text-yellow-200">{title}</h2>
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
