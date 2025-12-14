import React from "react";
import "./Input.css";

const Input = ({
  label,
  type = "text",
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  required = false,
  min,
  max,
  error,
  disabled,
  helpText,
  ...props
}) => {

  const handleChange = (e) => {
    if (onChange) onChange(e);   // ✅ ENVOIE L'ÉVÉNEMENT NORMAL
  };

  const handleBlur = (e) => {
    if (onBlur) onBlur(e);       // ✅ ENVOIE L'ÉVÉNEMENT NORMAL
  };

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={name}>
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}

      <input
        type={type}
        id={name}
        name={name}
        value={value || ""}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        required={required}
        min={min}
        max={max}
        disabled={disabled}
        className={`form-input ${error ? "error" : ""} ${disabled ? "disabled" : ""}`}
        {...props}
      />

      {error && <div className="error-message">{error}</div>}
      {helpText && !error && <div className="help-text">{helpText}</div>}
    </div>
  );
};

export default Input;
