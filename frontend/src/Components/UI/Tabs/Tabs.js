import React from "react";
import "./Tabs.css";

const Tabs = ({ tabs, active, onChange }) => {
  return (
    <div className="tabs">
      {tabs.map((tab, i) => (
        <button
          key={i}
          className={`tab-btn ${active === tab.key ? "active" : ""}`}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default Tabs;
