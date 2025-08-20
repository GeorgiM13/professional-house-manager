import { Link, Outlet } from "react-router-dom"
import { useState } from "react"
import "./styles/UserLayout.css"

export default function UserLayout() {
    const user = JSON.parse(localStorage.getItem('user'));
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    return (
        <div className="client-container">
            <button
                className={`mobile-menu-button ${sidebarOpen ? 'active' : ''}`}
                onClick={() => setSidebarOpen(!sidebarOpen)}
            >
                {sidebarOpen ? '✕' : '☰'}
            </button>

            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <h2 className="sidebar-title">Клиент панел</h2>
                <nav className="sidebar-nav">
                    <Link to="/client/userevents" className="sidebar-link">Събития</Link>
                    <Link to="/client/reports" className="sidebar-link">Подаване на сигнал</Link>
                    <Link to="/client/fees" className="sidebar-link">Задължения</Link>
                    <Link to="/client/expenses" className="sidebar-link">Разходи</Link>
                    <Link to="/client/buildingcash" className="sidebar-link">Каса</Link>
                </nav>
            </aside>

            <div className="main-wrapper">

                <header className="client-header">
                    <div className="user-dropdown">
                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="user-button"
                        >
                            {`${user?.first_name || ""} ${user?.last_name || ""}`.trim() || "Потребител"} ▼
                        </button>
                        {dropdownOpen && (
                            <div className="dropdown-menu">
                                <Link to="/client/profile/email" className="dropdown-link">Смени имейл</Link>
                                <Link to="/client/profile/username" className="dropdown-link">Смени потребителско име</Link>
                                <Link to="/client/profile/password" className="dropdown-link">Смени парола</Link>
                                <button onClick={handleLogout} className="dropdown-link">Излизане</button>
                            </div>
                        )}
                    </div>
                </header>

                <main className="client-main">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
