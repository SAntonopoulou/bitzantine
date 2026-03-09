import React from 'react';

export default function ConfirmationModal({
  title,
  message,
  children,
  isOpen,
  onClose,
  onConfirm,
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
        {message && <p className="text-stone-300 mb-6">{message}</p>}
        
        {children}

        <div className="flex justify-end gap-4 mt-8">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded text-stone-300 bg-stone-700 hover:bg-stone-600 transition-colors"
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
