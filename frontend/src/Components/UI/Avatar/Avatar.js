import React from "react";
import "./Avatar.css";

const Avatar = ({ src, size = 48, alt = "avatar", rounded = true }) => {
  return (
    <img
      className={`ui-avatar ${rounded ? "rounded" : ""}`}
      src={src || "/assets/default-avatar.png"}
      alt={alt}
      style={{ width: size, height: size }}
    />
  );
};

export default Avatar;
