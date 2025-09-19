import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div 
    style={{ marginTop: 0 }} 
    className="fixed inset-0 z-50 bg-gray-600 bg-opacity-50 flex justify-center items-center"
  >
    <div className="bg-white rounded-lg shadow-lg w-full max-w-lg">
      <div>{children}</div>
    </div>
  </div>
  
  );
};
