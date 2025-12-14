import React from "react";
import { Link } from "react-router-dom";
import { useUser } from "../../../Context/UserContext";
import Button from "../../UI/Button/Button";
import "./Header.css";

const Header = () => {
  const { isAuthenticated, user, logout } = useUser();

  const closeMenu = () => {
    document.getElementById("nav-toggle").checked = false;
  };

  return (
    <header className="header">
      <div className="container">

        {/* LOGO */}
        <Link to="/" className="logo" onClick={closeMenu}>
          ExpressTrafic
        </Link>

        {/* NAVIGATION MOBILE */}
        <input type="checkbox" id="nav-toggle" className="nav-toggle" />
        <label htmlFor="nav-toggle" className="nav-toggle-label">
          <span></span>
        </label>

        <div className="nav-links">
          <Link to="/" onClick={closeMenu}>Accueil</Link>
          <Link to="/travels" onClick={closeMenu}>Trajets</Link>
          <Link to="/about" onClick={closeMenu}>À propos</Link>
          <Link to="/contact" onClick={closeMenu}>Contact</Link>

          {isAuthenticated ? (
            <>
              <span className="hello">Bonjour, {user?.prenom}</span>
              <Link to="/profile" onClick={closeMenu}>Profil</Link>
              <Button onClick={() => { logout(); closeMenu(); }} variant="outline">
                Déconnexion
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={closeMenu}>Connexion</Link>
              <Link to="/signup" onClick={closeMenu}>Inscription</Link>
            </>
          )}
        </div>

      </div>
    </header>
  );
};

export default Header;
