import type { ReactNode } from 'react';
import { X } from '@phosphor-icons/react';
import { Card } from './Card';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function Dialog({ open, onClose, title, children }: DialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <Card
        className="relative w-full max-w-md rounded-b-none bg-slate-900/90 p-5 sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Fermer"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"
        >
          <X size={20} />
        </button>
        {title && <h2 className="mb-4 pr-8 text-lg font-semibold text-white">{title}</h2>}
        {children}
      </Card>
    </div>
  );
}
