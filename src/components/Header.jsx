import { Link, useNavigate } from "react-router-dom"
import { useState } from "react"
import "./header.css"
import homeImg from "./assets/home.png"

function Header() {
    const [menuOpen, setMenuOpen] = useState(false);

    const navigate = useNavigate();

    return (
        <header>
            <h1><Link to="/">Профи Дом-Русе</Link></h1>

            <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
                ☰
            </button>

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
