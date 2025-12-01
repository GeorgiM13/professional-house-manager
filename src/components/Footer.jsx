import { Link } from "react-router-dom";
import "./styles/Footer.css";

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-content">

        <div className="footer-section">
          <h3>Работно време</h3>
          <div className="info-item">
            <svg className="footer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            <p>Понеделник - Петък:<br /><strong>09:00 - 17:00</strong></p>
          </div>
          <div className="info-item">
            <svg className="footer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
            <p>Събота и неделя:<br /><span className="highlight-text">Почивен ден</span></p>
          </div>
        </div>

        <div className="footer-section">
          <h3>Информация</h3>
          <ul className="footer-links">
            <li><Link to="/">Начало</Link></li>
            <li><Link to="/for-us">За нас</Link></li>
            <li><Link to="/documents">Документи</Link></li>
            <li><Link to="/contacts">Контакти</Link></li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>Свържи се с нас</h3>
          <div className="info-item">
            <svg className="footer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            <p>гр. Русе<br />ул. Александровска 97</p>
          </div>
          <div className="info-item">
            <svg className="footer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            <p>Калоян Миланов<br /><a href="tel:0898563392" className="phone-link">0898 563 392</a></p>
          </div>
        </div>

      </div>

      <div className="footer-bottom">
        <p>© 2025 Профи Дом-Русе. Всички права запазени.</p>
      </div>
    </footer>
  );
}

export default Footer;