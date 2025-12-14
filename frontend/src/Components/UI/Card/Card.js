import React from "react";
import "./Card.css";

const Card = ({ title, children, footer }) => {
  return (
    <div className="ui-card">
      {title && <div className="ui-card-header">{title}</div>}
      <div className="ui-card-body">{children}</div>
      {footer && <div className="ui-card-footer">{footer}</div>}
    </div>
  );
};

export default Card;
