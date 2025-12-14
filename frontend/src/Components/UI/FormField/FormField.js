import React from "react";
import "./FormField.css";

const FormField = ({ label, error, children }) => {
  return (
    <div className="form-field">
      {label && <label className="form-field-label">{label}</label>}
      {children}
      {error && <p className="form-field-error">{error}</p>}
    </div>
  );
};

export default FormField;
