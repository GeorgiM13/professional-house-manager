import { Link, Outlet } from "react-router-dom"
import { useState } from "react"
import "./styles/AdminLayout.css"

export default function AdminLayout() {
    const user = JSON.parse(localStorage.getItem('user'));
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    return (
        <div className="admin-container">
            <button
                className={`mobile-menu-button ${sidebarOpen ? 'active' : ''}`}
                onClick={() => setSidebarOpen(!sidebarOpen)}
            >
                {sidebarOpen ? '✕' : '☰'}
            </button>

            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <h2 className="sidebar-title">Админ панел</h2>
                <nav className="sidebar-nav">
                    <Link to="/admin/adminevents" className="sidebar-link">Събития</Link>
                    <Link to="/admin/reports" className="sidebar-link">Подадени сигнали</Link>
                    <Link to="/admin/contactforms" className="sidebar-link">Подадени контактни форми</Link>
                    <Link to="/admin/fees" className="sidebar-link">Събиране на такси</Link>
                    <Link to="/admin/expenses" className="sidebar-link">Разходи</Link>
                    <Link to="/admin/buildingcash" className="sidebar-link">Каса сгради</Link>
                </nav>
            </aside>

            <div className="main-wrapper">

                <header className="admin-header">
                    <div className="user-dropdown">
                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="user-button"
                        >
                            {`${user?.first_name || ""} ${user?.last_name || ""}`.trim() || "Потребител"} ▼
                        </button>
                        {dropdownOpen && (
                            <div className="dropdown-menu">
                                <Link to="/admin/profile/email" className="dropdown-link">Смени имейл</Link>
                                <Link to="/admin/profile/username" className="dropdown-link">Смени потребителско име</Link>
                                <Link to="/admin/profile/password" className="dropdown-link">Смени парола</Link>
                                <button onClick={handleLogout} className="dropdown-link">Излизане</button>
                            </div>
                        )}
                    </div>
                </header>

                <main className="admin-main">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
