import React from "react";
import "./ErrorMessage.css";

const ErrorMessage = ({ message }) => {
  if (!message) return null;

  return (
    <div className="error-msg">
      ⚠️ {message}
    </div>
  );
};

export default ErrorMessage;
