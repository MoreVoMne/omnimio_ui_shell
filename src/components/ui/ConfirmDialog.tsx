import React from 'react';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  destructive = false,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-charcoal/40 flex items-center justify-center p-6">
      <div className="bg-cream border border-charcoal rounded-[20px] p-6 max-w-md w-full">
        <h2 className="font-serif text-xl mb-4">{title}</h2>
        <p className="font-mono text-xs uppercase tracking-widest text-charcoal/70 mb-6 leading-relaxed">
          {message}
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="border border-charcoal px-4 py-2 rounded-full font-mono text-[10px] uppercase tracking-widest hover:bg-charcoal hover:text-cream transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`border px-4 py-2 rounded-full font-mono text-[10px] uppercase tracking-widest transition-colors ${
              destructive
                ? 'border-red-600 bg-red-600 text-cream hover:bg-red-700'
                : 'border-charcoal bg-charcoal text-cream hover:bg-charcoal/90'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;

