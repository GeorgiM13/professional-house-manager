import { Link, Outlet, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useState } from "react";
import "./styles/AdminLayout.css";

export default function AdminLayout() {
  const user = JSON.parse(localStorage.getItem("user"));
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("user");
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="admin-container">
      <button
        className={`mobile-menu-button ${sidebarOpen ? "active" : ""}`}
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? "" : "☰"}
      </button>

      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-title">Админ панел</h2>
          <button
            className="sidebar-close-button"
            onClick={() => setSidebarOpen(false)}
          >
            ✕
          </button>
        </div>
        <nav className="sidebar-nav">
          <Link
            to="/admin/adminevents"
            className="sidebar-link"
            onClick={() => setSidebarOpen(false)}
          >
            Събития
          </Link>
          <Link
            to="/admin/reports"
            className="sidebar-link"
            onClick={() => setSidebarOpen(false)}
          >
            Подадени сигнали
          </Link>
          <Link
            to="/admin/contactforms"
            className="sidebar-link"
            onClick={() => setSidebarOpen(false)}
          >
            Подадени контактни форми
          </Link>
          <Link
            to="/admin/fees"
            className="sidebar-link"
            onClick={() => setSidebarOpen(false)}
          >
            Събиране на такси
          </Link>
          <Link
            to="/admin/expenses"
            className="sidebar-link"
            onClick={() => setSidebarOpen(false)}
          >
            Разходи
          </Link>
          <Link
            to="/admin/buildingcash"
            className="sidebar-link"
            onClick={() => setSidebarOpen(false)}
          >
            Каса сгради
          </Link>
        </nav>
      </aside>

      <div className="main-wrapper">
        <header className="admin-header">
          <div className="user-dropdown">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="user-button"
            >
              {`${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
                "Потребител"}{" "}
              ▼
            </button>
            {dropdownOpen && (
              <div className="dropdown-menu">
                <Link
                  to="/admin/profile/change"
                  className="dropdown-link"
                  onClick={() => setDropdownOpen(false)}
                >
                  Промяна на данни
                </Link>
                <Link
                  to="/admin/buildings"
                  className="dropdown-link"
                  onClick={() => setDropdownOpen(false)}
                >
                  Управление сгради
                </Link>
                <Link
                  to="/admin/users"
                  className="dropdown-link"
                  onClick={() => setDropdownOpen(false)}
                >
                  Управление на потребители
                </Link>
                <button onClick={handleLogout} className="dropdown-link">
                  Излизане
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="admin-main">
          <div className="page-content-wrapper">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
