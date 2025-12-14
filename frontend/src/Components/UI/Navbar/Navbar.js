import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const toggleMenu = () => setOpen(!open);
  const closeMenu = () => setOpen(false);

  return (
    <header className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo" onClick={closeMenu}>
          ExpressTrafic
        </Link>

        <button className="nav-toggle" onClick={toggleMenu}>
          ☰
        </button>

        <nav className={`nav-menu ${open ? "open" : ""}`}>
          <Link to="/" onClick={closeMenu}>Accueil</Link>
          <Link to="/travels" onClick={closeMenu}>Trajets</Link>
          <Link to="/about" onClick={closeMenu}>À propos</Link>
          <Link to="/contact" onClick={closeMenu}>Contact</Link>
          <Link to="/login" onClick={closeMenu}>Connexion</Link>
          <Link to="/signup" onClick={closeMenu}>Inscription</Link>
        </nav>
      </div>
    </header>
  );
}
