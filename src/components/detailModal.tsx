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
      className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-white/70 backdrop-blur-sm p-6 rounded-lg w-[80%] min-h-[50vh] max-h-[60vh] shadow-lg relative overflow-y-auto flex flex-col">
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold cursor-pointer transition-all duration-200 hover:scale-125"
          onClick={onClose}
        >
          ×
        </button>
        <h2 className="text-[2rem] font-bold mb-4">{title}</h2>
        <div className="flex-1 flex flex-col h-full">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
