import React from "react";
import { Card } from "../../../Components/UI";
import "./FormSection.css";


const FormSection = ({ title, children, className = "" }) => {
  return (
    <Card className={`form-section ${className}`}>
      {title && (
        <div className="form-section-header">
          <h3 className="form-section-title">{title}</h3>
        </div>
      )}
      <div className="form-section-content">
        {children}
      </div>
    </Card>
  );
};

export default FormSection;
