import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "./styles/Header.css";

import { useTheme } from "./ThemeContext.jsx";

import logoImg from "./assets/logo.svg"; 
import logoDark from "./assets/logo_dark.svg"; 

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  const navigate = useNavigate();
  const closeMenu = () => setMenuOpen(false);

  const { isDarkMode, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header className={`main-header ${scrolled ? "scrolled" : ""}`}>
        <div className="logo-container">
          <Link to="/" onClick={closeMenu}>
            <img
              src={isDarkMode ? logoDark : logoImg}
              className="app-logo"
              alt="Профи Дом Русе"
            />
          </Link>
        </div>

        <button
          className={`menu-toggle ${menuOpen ? "open" : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </button>

        <div
          className={`nav-overlay ${menuOpen ? "active" : ""}`}
          onClick={closeMenu}
        ></div>

        <nav className={`nav ${menuOpen ? "active" : ""}`}>
          <button className="close-menu-btn" onClick={closeMenu}>
            &times;
          </button>

          <ul>
            <li>
              <Link to="/" onClick={closeMenu} className="home-link" aria-label="Начало">
                <svg className="home-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
              </Link>
            </li>
            <li><Link to="/for-us" onClick={closeMenu}>За нас</Link></li>
            <li><Link to="/documents" onClick={closeMenu}>Документи</Link></li>
            <li><Link to="/contacts" onClick={closeMenu}>Контакти</Link></li>
            
            <li className="theme-toggle-li">
                <button
                onClick={toggleTheme}
                style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "22px",
                    padding: "0 10px",
                    lineHeight: "1"
                }}
                title={isDarkMode ? "Включи светъл режим" : "Включи тъмен режим"}
                >
                {isDarkMode ? "☀️" : "🌙"}
                </button>
            </li>

            <li className="cta-container">
              <button
                className="login-btn-header"
                onClick={() => {
                  closeMenu();
                  navigate("/login");
                }}
              >
                Вход за клиенти
              </button>
            </li>
          </ul>
        </nav>
      </header>

      <div className="header-spacer"></div>
    </>
  );
}

export default Header;