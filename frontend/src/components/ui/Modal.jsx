import React from "react";
import { X } from "lucide-react";

export default function Modal({ title, onClose, children }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <X size={18} style={{ cursor: "pointer", color: "var(--muted)" }} onClick={onClose} />
        </div>
        {children}
      </div>
    </div>
  );
}
