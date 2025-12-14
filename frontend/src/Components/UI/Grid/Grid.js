import React from "react";
import "./Grid.css";

const Grid = ({ children, columns = 2 }) => {
  return (
    <div className="grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {children}
    </div>
  );
};

export default Grid;
