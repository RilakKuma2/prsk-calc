import React, { useRef } from 'react';
import useModalAccessibility from '../../hooks/useModalAccessibility';

const ConfirmModal = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = '확인',
    cancelText = '취소',
    confirmColor = 'red' // red, blue, etc.
}) => {
    const cancelButtonRef = useRef(null);
    const dialogRef = useModalAccessibility({
        isOpen,
        onClose: onCancel,
        initialFocusRef: cancelButtonRef,
    });

    if (!isOpen) return null;

    const confirmBtnClass = confirmColor === 'red'
        ? "bg-red-500 hover:bg-red-600 text-white"
        : "bg-blue-500 hover:bg-blue-600 text-white";

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onCancel}>
            <div ref={dialogRef} role="alertdialog" aria-modal="true" aria-labelledby="confirm-modal-title" aria-describedby="confirm-modal-message" tabIndex={-1} className="bg-white rounded-xl shadow-2xl w-full max-w-sm max-h-[calc(100vh-2rem)] supports-[height:100dvh]:max-h-[calc(100dvh-2rem)] overflow-y-auto animate-scale-in" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 id="confirm-modal-title" className="font-bold text-gray-800 text-lg">{title}</h3>
                    <button type="button" onClick={onCancel} aria-label={cancelText} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div className="p-6">
                    <p id="confirm-modal-message" className="text-gray-600 whitespace-pre-wrap">{message}</p>
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <button
                        ref={cancelButtonRef}
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className={`px-4 py-2 rounded-lg font-bold shadow-sm transition-colors ${confirmBtnClass}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
