import React from "react";
import "./Breadcrumb.css";

const Breadcrumb = ({ items = [] }) => {
  return (
    <nav className="ui-breadcrumb">
      {items.map((item, index) => (
        <span key={index} className="breadcrumb-item">
          {item.link ? (
            <a href={item.link}>{item.label}</a>
          ) : (
            <span className="active">{item.label}</span>
          )}

          {index < items.length - 1 && <span className="separator">/</span>}
        </span>
      ))}
    </nav>
  );
};

export default Breadcrumb;
