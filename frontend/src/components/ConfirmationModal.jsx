import React from 'react';

export default function ConfirmationModal({ message, onConfirm, onCancel, isOpen, confirmText = "Confirm Delete" }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
      <div className="bg-stone-800 rounded-lg shadow-xl p-8 max-w-sm w-full">
        <p className="text-stone-200 text-lg mb-6">{message}</p>
        <div className="flex justify-end gap-4">
          <button 
            onClick={onCancel} 
            className="px-4 py-2 rounded text-stone-300 hover:bg-stone-700"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
