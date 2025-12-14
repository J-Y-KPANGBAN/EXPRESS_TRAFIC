import React from "react";
import "./Switch.css";

const Switch = ({ checked, onChange }) => {
  return (
    <label className="switch">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="slider"></span>
    </label>
  );
};

export default Switch;
