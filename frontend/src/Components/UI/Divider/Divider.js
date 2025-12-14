import React from "react";
import "./Divider.css";

const Divider = ({ text }) => {
  return (
    <div className="divider">
      {text && <span className="divider-text">{text}</span>}
    </div>
  );
};

export default Divider;
