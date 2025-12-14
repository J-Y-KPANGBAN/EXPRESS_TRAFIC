import React from "react";
import "./Checkbox.css";

const Checkbox = ({ label, onChange, name, ...props }) => {

  const handleChange = (e) => {
    if (onChange) {
      onChange(e.target.checked, e);
    }
  };

  return (
    <label className="checkbox-container">
      <input
        type="checkbox"
        name={name}
        {...props}
        onChange={handleChange}
      />
      <span className="checkbox-custom" />
      {label && <span className="checkbox-label">{label}</span>}
    </label>
  );
};

export default Checkbox;
