"use client";

import Modal from "./Modal";

export default function ConfirmDialog({
  title = "Confirmar",
  message,
  confirmLabel = "Eliminar",
  onConfirm,
  onCancel,
}: {
  title?: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="text-sm text-gray-600 mb-5">{message}</p>
      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded border text-sm font-medium text-brand-gray hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 rounded bg-red-600 text-white text-sm font-medium hover:bg-red-700"
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
