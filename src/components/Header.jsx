import { Link, useNavigate } from "react-router-dom"
import { useState } from "react"
import "./header.css"
import homeImg from "./assets/Home.png"
import logoImg from "./assets/logo.svg"

function Header() {
    const [menuOpen, setMenuOpen] = useState(false);

    const navigate = useNavigate();

    return (
        <header>
            <h1 className="logo-header"><Link to="/"><img className="logoimg" src={logoImg} /></Link></h1>

            <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
                ☰
            </button>

            <div className={`nav-overlay ${menuOpen ? "active" : ""}`}
                onClick={() => setMenuOpen(false)}></div>

            <div className={`nav ${menuOpen ? "active" : ""}`}>
                <ul>
                    <li><Link to="/"><img className="homeimg" src={homeImg} alt="" /></Link></li>
                    <li><Link to="/for-us">За нас</Link></li>
                    <li><Link to="/documents">Документи</Link></li>
                    <li><Link to="/contacts">Контакти</Link></li>
                    <button onClick={() => navigate("/login")}>Вход за клиенти</button>

                </ul>
            </div>
        </header>
    );
}

export default Header;
