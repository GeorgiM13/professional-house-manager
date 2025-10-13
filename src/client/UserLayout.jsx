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
                {sidebarOpen ? '' : '☰'}
            </button>

            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <h2 className="sidebar-title">Админ панел</h2>
                    <button
                        className="sidebar-close-button"
                        onClick={() => setSidebarOpen(false)}
                    >
                        ✕
                    </button>
                </div>
                <h2 className="sidebar-title">Клиент панел</h2>
                <nav className="sidebar-nav">
                    <Link to="/client/userevents" className="sidebar-link" onClick={() => setSidebarOpen(false)}>Събития</Link>
                    <Link to="/client/reports" className="sidebar-link" onClick={() => setSidebarOpen(false)}>Подаване на сигнал</Link>
                    <Link to="/client/fees" className="sidebar-link" onClick={() => setSidebarOpen(false)}>Задължения</Link>
                    <Link to="/client/expenses" className="sidebar-link" onClick={() => setSidebarOpen(false)}>Разходи</Link>
                    <Link to="/client/buildingcash" className="sidebar-link" onClick={() => setSidebarOpen(false)}>Каса</Link>
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
                                <Link to="/client/profile/change" className="dropdown-link" onClick={() => setDropdownOpen(false)}>Промяна на данни</Link>
                                <button onClick={handleLogout} className="dropdown-link">Излизане</button>
                            </div>
                        )}
                    </div>
                </header>

                <main className="client-main">
                    <div className="page-content-wrapper">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
