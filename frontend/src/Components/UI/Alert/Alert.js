// src/Components/UI/Alert/Alert.js
import React from "react";
import "./Alert.css";

const Alert = ({ type = "info", title, message, onClose }) => {
  return (
    <div className={`ui-alert ui-alert--${type}`}>
      <div className="ui-alert-content">
        {title && <h4 className="ui-alert-title">{title}</h4>}
        {message && <p className="ui-alert-message">{message}</p>}
      </div>
      {onClose && (
        <button className="ui-alert-close" onClick={onClose}>
          ✕
        </button>
      )}
    </div>
  );
};

export default Alert;
