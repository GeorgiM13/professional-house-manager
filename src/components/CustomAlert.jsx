import React from "react";
import "./styles/CustomAlert.css";

function CustomAlert({ message, type = "info", onClose }) {
  if (!message) return null;

  return (
    <div className="custom-alert-overlay">
      <div className={`custom-alert-box ${type}`}>
        <p className="custom-alert-message">{message}</p>
        <button className="custom-alert-button" onClick={onClose}>
          OK
        </button>
      </div>
    </div>
  );
}

export default CustomAlert;
