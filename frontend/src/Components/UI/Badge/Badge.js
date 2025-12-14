import React from "react";
import "./Badge.css";

const Badge = ({ label, type = "default" }) => {
  return <span className={`ui-badge ${type}`}>{label}</span>;
};

export default Badge;
