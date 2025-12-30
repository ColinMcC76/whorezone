import React, { ReactNode } from 'react';

interface ModalProps {
  onClose: () => void;
  children: ReactNode;
}

// Generic modal component that overlays the page and displays its children
// content. It includes a semi‑transparent backdrop and calls onClose when
// the backdrop is clicked. You can also place a close button inside the
// children.
export default function Modal({ onClose, children }: ModalProps) {
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if the user clicks the backdrop itself, not the content
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        {children}
      </div>
    </div>
  );
}