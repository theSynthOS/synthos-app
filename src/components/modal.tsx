import React from "react";

interface ModalProps {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ onClose, title, children }) => {
  // Handle clicking outside the modal
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
      <div className="bg-white/90 backdrop-blur-sm p-6 rounded-lg w-[80%] h-[80vh] shadow-lg">
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <div>{children}</div>
        <button
          className="mt-4 bg-gray-500 text-white px-4 py-2 rounded-md"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default Modal;
