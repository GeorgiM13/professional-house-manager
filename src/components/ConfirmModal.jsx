import React from "react";
import "./styles/ConfirmModal.css";

function ConfirmModal({ title, message, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h2 className="modal-title">{title}</h2>
        <p className="modal-message">{message}</p>
        <div className="modal-buttons">
          <button className="btn cancel" onClick={onCancel}>Отказ</button>
          <button className="btn delete" onClick={onConfirm}>Изтрий</button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
