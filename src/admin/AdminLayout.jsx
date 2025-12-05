import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useState, useEffect } from "react";
import { useTheme } from "../components/ThemeContext";
import "./styles/AdminLayout.css";

export default function AdminLayout() {
  const { isDarkMode, toggleTheme } = useTheme();
  
  const [user, setUser] = useState({});
  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (window.innerWidth <= 768) {
      document.body.style.overflow = sidebarOpen ? 'hidden' : 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [sidebarOpen]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("user");
    localStorage.clear();
    navigate("/");
  };

  const navConfig = [
    {
      title: "Комуникация",
      items: [
        { to: "/admin/adminevents", label: "Събития", icon: "📅" },
        { to: "/admin/reports", label: "Сигнали", icon: "⚠️" },
        { to: "/admin/contactforms", label: "Контактни форми", icon: "✉️" },
      ],
    },
    {
      title: "Финанси",
      items: [
        { to: "/admin/fees", label: "Такси", icon: "💰" },
        { to: "/admin/expenses", label: "Разходи", icon: "💸" },
        { to: "/admin/buildingcash", label: "Каса", icon: "🏦" },
      ],
    },
    {
      title: "Администрация",
      items: [
        { to: "/admin/buildings", label: "Сгради", icon: "🏢" },
        { to: "/admin/users", label: "Потребители", icon: "👥" },
      ],
    },
  ];

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <div className={`admin-container ${isDarkMode ? "admin-dark" : "admin-light"}`}>
      
      <div 
        className={`admin-overlay ${sidebarOpen ? "show" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="admin-sidebar-header">
          <div className="admin-brand">
            <span className="admin-brand-icon">🏠</span>
            <h2 className="admin-brand-text">Профи Дом - Русе</h2>
          </div>
          <button className="admin-close-btn" onClick={() => setSidebarOpen(false)}>✕</button>
        </div>

        <div className="admin-sidebar-scroll">
          {navConfig.map((group, index) => (
            <div key={index} className="admin-nav-group">
              <h4 className="admin-group-title">{group.title}</h4>
              <nav className="admin-nav-list">
                {group.items.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`admin-nav-item ${isActive(item.to) ? "active" : ""}`}
                  >
                    <span className="admin-nav-icon">{item.icon}</span>
                    <span className="admin-nav-label">{item.label}</span>
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>

        <div className="admin-sidebar-footer">
          <div className="admin-user-card">
            <div className="admin-avatar">
              {user?.first_name?.[0] || "A"}
            </div>
            <div className="admin-user-info">
              <span className="admin-user-name">
                {user?.first_name || "Admin"} {user?.last_name || ""}
              </span>
              <span className="admin-user-role">Администратор</span>
            </div>
          </div>
        </div>
      </aside>

      <div className="admin-main-wrapper">
        <header className="admin-top-header">
          <div className="admin-header-left">
            <button className="admin-menu-toggle" onClick={() => setSidebarOpen(true)}>
              ☰
            </button>
            <h2 className="admin-page-title-mobile">Табло</h2>
          </div>

          <div className="admin-header-right">
            <button 
              className="admin-theme-btn" 
              onClick={toggleTheme}
              title={isDarkMode ? "Светъл режим" : "Тъмен режим"}
            >
              {isDarkMode ? "☀️" : "🌙"}
            </button>

            <div className="admin-dropdown-container">
              <button
                className={`admin-profile-btn ${dropdownOpen ? "active" : ""}`}
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <span>Профил</span>
                <span className="admin-arrow">▼</span>
              </button>

              {dropdownOpen && (
                <>
                  <div className="admin-dropdown-overlay" onClick={() => setDropdownOpen(false)} />
                  <div className="admin-dropdown-menu">
                    <div className="admin-dd-header">
                      <p className="admin-dd-name">{user?.first_name} {user?.last_name}</p>
                      <p className="admin-dd-email">{user?.email}</p>
                    </div>
                    <Link to="/admin/profile/change" className="admin-dd-item" onClick={() => setDropdownOpen(false)}>
                      ⚙️ Настройки
                    </Link>
                    <button onClick={handleLogout} className="admin-dd-item logout">
                      🚪 Изход
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="admin-content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
}