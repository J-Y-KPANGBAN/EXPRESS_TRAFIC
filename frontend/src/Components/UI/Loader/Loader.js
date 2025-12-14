// frontend/src/Components/UI/Loader.jsx
import React from "react";
import "./Loader.css";

const Loader = ({ size = 40 }) => {
  return (
    <div
      className="loader"
      style={{ width: size, height: size }}
    ></div>
  );
};

export default Loader;
