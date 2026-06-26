import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export function Modal({ title, description, open, onClose, children }) {
  if (!open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-zinc-950/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/70 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-zinc-950">
              {title}
            </h2>

            {description && (
              <p className="mt-1 text-sm text-zinc-500">
                {description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-950"
          >
            <X size={18} strokeWidth={1.8} />
          </button>
        </div>

        {children}
      </div>
    </div>,
    document.body
  );
}