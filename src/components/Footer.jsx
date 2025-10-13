import { Link } from "react-router-dom"
import "./styles/Footer.css"

function Footer() {
    return (
        <footer>
            <div className="footer-container">
                <div className="leftdiv">
                    <h2>Работно време</h2>
                    <p>Понеделник - Петък: 09:00 - 17:00</p>
                    <p>Събота и неделя: Почивен ден</p>
                </div>

                <div className="centerdiv">
                    <h2>Информация</h2>
                    <ul>
                        <li><Link to="/">Начало</Link></li>
                        <li><Link to="/for-us">За нас</Link></li>
                        <li><Link to="/documents">Документи</Link></li>
                        <li><Link to="/contacts">Контакти</Link></li>
                    </ul>
                </div>

                <div className="rightdiv">
                    <h2>Свържи се с нас</h2>
                    <p>гр. Русе, ул. Александровска 97</p>
                    <p>Калоян Миланов: 0898563392</p>
                    <p className="copyright">© 2025 Профи Дом-Русе</p>
                </div>

            </div>

        </footer>
    );
}

export default Footer;
