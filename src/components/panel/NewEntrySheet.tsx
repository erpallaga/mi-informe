"use client";

import QuickEntryForm from "./QuickEntryForm";

interface NewEntrySheetProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NewEntrySheet({ open, onClose, onSuccess }: NewEntrySheetProps) {
  function handleSuccess() {
    onSuccess();
    setTimeout(() => onClose(), 1500);
  }

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-on-surface/30 transition-opacity duration-300 ease-out ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white flex flex-col overflow-hidden transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ height: "100dvh" }}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 pt-4 pb-4">
          <p className="text-xs font-medium uppercase tracking-widest text-on-surface-variant">
            Nueva entrada
          </p>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-medium uppercase tracking-widest text-on-surface-variant py-1"
          >
            Cerrar
          </button>
        </div>

        {/* Scrollable form area */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <QuickEntryForm defaultOtrosOpen={true} onSuccess={handleSuccess} />
        </div>
      </div>
    </>
  );
}
