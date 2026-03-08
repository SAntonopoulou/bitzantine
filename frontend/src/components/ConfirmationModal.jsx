import React from 'react';

export default function ConfirmationModal({ 
  message, 
  onConfirm, 
  onCancel, 
  isOpen, 
  title = "Are you sure?",
  confirmText = "Confirm", 
  isDestructive = false 
}) {
  if (!isOpen) return null;

  const confirmButtonStyles = isDestructive
    ? "bg-red-600 hover:bg-red-700 text-white"
    : "bg-amber-600 hover:bg-amber-700 text-white";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
      <div className="bg-stone-800 rounded-lg shadow-xl p-6 sm:p-8 max-w-md w-full border border-stone-700">
        <h2 className="text-xl font-bold text-stone-100 mb-4">{title}</h2>
        <p className="text-stone-300 mb-8">{message}</p>
        <div className="flex justify-end gap-4">
          <button 
            onClick={onCancel} 
            className="px-4 py-2 rounded text-stone-300 hover:bg-stone-700 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            className={`px-4 py-2 rounded font-medium transition-colors ${confirmButtonStyles}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
