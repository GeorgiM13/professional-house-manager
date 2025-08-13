import { Link } from "react-router-dom"
import { useState } from "react"
import "./header.css"
import homeImg from "./assets/home.png"

function Header() {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <header>
            <h1><Link to="/">Профи Дом</Link></h1>

            <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
                ☰
            </button>

            <div className={`nav ${menuOpen ? "active" : ""}`}>
                <ul>
                    <li><Link to="/"><img className="homeimg" src={homeImg} alt="" /></Link></li>
                    <li><Link to="/for-us">За нас</Link></li>
                    <li><Link to="/documents">Документи</Link></li>
                    <li><Link to="/contacts">Контакти</Link></li>
                    <button><Link to="/login">Вход за клиенти</Link></button>
                </ul>
            </div>
        </header>
    );
}

export default Header;
