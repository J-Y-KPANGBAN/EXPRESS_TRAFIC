import React from "react";
import "./Select.css";

const Select = ({ 
  label, 
  name, 
  value, 
  onChange, 
  onBlur,
  options = [], 
  placeholder,
  error,
  disabled,
  required,
  ...props 
}) => {
  
  const handleChange = (e) => {
    if (onChange) onChange(e);   // 🔥 ON RENVOIE L'ÉVÉNEMENT COMPLET
  };

  const handleBlur = (e) => {
    if (onBlur) onBlur(e);
  };

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={name}>
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}

      <select
        id={name}
        name={name}
        value={value || ""}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled}
        className={`form-select ${error ? 'error' : ''} ${disabled ? 'disabled' : ''}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default Select;
