import React, { useEffect } from "react";
import "./Modal.css";

const Modal = ({ open, onClose, title, children, isOpen, visible, show }) => {
  const isModalOpen = open || isOpen || visible || show || false;

  // Bloque le scroll du body
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isModalOpen]);

  if (!isModalOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box modal-box-compact"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close-x" onClick={onClose}>✖</button>

        {title && <h3 className="modal-title">{title}</h3>}

        <div className="modal-content modal-content-scrollable">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;