import React from "react";
import "./Radio.css";

const Radio = ({
  label,
  name,
  value,
  onChange,
  options = [],
  inline = false,
  error,
  disabled,
  ...props
}) => {

  const handleChange = (e) => {
    if (onChange) {
      onChange(e.target.value, e);
    }
  };

  return (
    <div className="form-group">
      {label && <label className="radio-label">{label}</label>}

      <div className={`radio-group ${inline ? "inline" : ""}`}>
        {options.map((option) => (
          <label key={option.value} className="radio-option">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={handleChange}
              disabled={disabled}
              {...props}
            />
            <span className="radio-checkmark"></span>
            <span className="radio-text">{option.label}</span>
          </label>
        ))}
      </div>

      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default Radio;
