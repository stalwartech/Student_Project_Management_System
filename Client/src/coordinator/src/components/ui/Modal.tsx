import type { ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}

// Usage: <Modal open={isOpen} onClose={() => setIsOpen(false)} title="New Session" footer={<Button>Save</Button>}>...</Modal>
export function Modal({ open, onClose, title, children, footer, size = "md" }: ModalProps) {
  if (!open) return null;

  const widthClass = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl" }[size];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className={`card w-full ${widthClass} max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
            ✕
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
}
