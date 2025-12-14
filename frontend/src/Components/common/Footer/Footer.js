import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">

        <div className="footer-grid">

          {/* BRAND */}
          <div className="footer-section">
            <Link to="/" className="footer-brand">
              <h3>ExpressTrafic</h3>
              <span>Voyagez en toute sérénité</span>
            </Link>

            <p className="footer-desc">
              Votre plateforme de confiance pour réserver vos trajets en bus facilement et en toute sécurité.
            </p>

            <h4 className="footer-subtitle">Suivez-nous</h4>

            {/* SOCIAL ICONS */}
            <div className="social-logos">

              <a href="#" className="social-logo" aria-label="Facebook">
                <img src="/icons/facebook.svg" alt="Facebook" />
              </a>
                    
              <a href="#" className="social-logo" aria-label="Instagram">
                <img src="/icons/insta.svg" alt="Instagram" />
              </a>

              <a href="#" className="social-logo" aria-label="LinkedIn">
                <img src="/icons/Link.svg" alt="LinkedIn" />
              </a>

              <a href="#" className="social-logo" aria-label="X">
                <img src="/icons/X.svg" alt="X" />
              </a>

              <a href="#" className="social-logo" aria-label="yout">
                <img src="/icons/yout.svg" alt="Youtube" />
              </a>

            </div>
          </div>

          {/* NAVIGATION */}
          <div className="footer-section">
            <h4 className="footer-subtitle">Navigation</h4>
            <Link className="footer-link" to="/">Accueil</Link>
            <Link className="footer-link" to="/travels">Trajets</Link>
            <Link className="footer-link" to="/about">À propos</Link>
            <Link className="footer-link" to="/contact">Contact</Link>
            <Link className="footer-link" to="/faq">FAQ</Link>
          </div>

          {/* LEGAL */}
          <div className="footer-section">
            <h4 className="footer-subtitle">Légal</h4>
            <Link className="footer-link" to="/mentions-legales">Mentions légales</Link>
            <Link className="footer-link" to="/privacy-policy">Politique de confidentialité</Link>
            <Link className="footer-link" to="/terms">Conditions générales</Link>
          </div>

          {/* CONTACT */}
          <div className="footer-section">
            <h4 className="footer-subtitle">Contact</h4>

            <p className="footer-contact-label">Email :</p>
            <a href="mailto:contact@expresstrafic.com" className="footer-link">
              contact@expresstrafic.com
            </a>

            <p className="footer-contact-label">Téléphone :</p>
            <a href="tel:+33123456789" className="footer-link">
              +33 1 23 45 67 89
            </a>
          </div>

        </div>

        {/* BOTTOM */}
        <div className="footer-bottom">
          © 2024 ExpressTrafic — Tous droits réservés.
        </div>

      </div>
    </footer>
  );
};

export default Footer;
