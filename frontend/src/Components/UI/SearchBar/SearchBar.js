import React from "react";
import "./SearchBar.css";

const SearchBar = ({ value, onChange, placeholder = "Rechercher..." }) => {
  return (
    <div className="searchbar">
      <input
        className="searchbar-input"
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

export default SearchBar;
