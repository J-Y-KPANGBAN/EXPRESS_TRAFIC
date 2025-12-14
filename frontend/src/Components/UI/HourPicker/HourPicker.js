import React, { useState } from "react";
import "./HourPicker.css";

const HourPicker = ({ label, value, onChange }) => {
  const [hour, setHour] = useState(value || "");

  const handleChange = (e) => {
    const val = e.target.value;
    setHour(val);

    if (onChange) onChange(val, e);
  };

  return (
    <div className="hourpicker-container">
      {label && <label className="hourpicker-label">{label}</label>}

      <input
        type="time"
        className="hourpicker-input"
        value={hour}
        onChange={handleChange}
      />
    </div>
  );
};

export default HourPicker;
