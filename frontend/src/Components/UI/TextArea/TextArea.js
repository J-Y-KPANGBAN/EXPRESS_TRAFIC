import React from "react";
import "./TextArea.css";

const TextArea = ({ label, error, onChange, name, ...props }) => {

  const handleChange = (e) => {
    if (onChange) {
      onChange(e.target.value, e);
    }
  };

  return (
    <div className="textarea-group">
      {label && <label className="textarea-label">{label}</label>}

      <textarea
        className="textarea-control"
        name={name}
        onChange={handleChange}
        {...props}
      />

      {error && <p className="textarea-error">{error}</p>}
    </div>
  );
};

export default TextArea;
