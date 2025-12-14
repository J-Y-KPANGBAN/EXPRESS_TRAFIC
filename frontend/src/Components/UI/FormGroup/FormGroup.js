import React from "react";
import "./FormGroup.css";

const FormGroup = ({ label, children }) => {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      {children}
    </div>
  );
};

export default FormGroup;
