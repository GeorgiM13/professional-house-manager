import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useState, useEffect } from "react";
import { useTheme } from "../components/ThemeContext";
import "./styles/UserLayout.css";

export default function UserLayout() {
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
      title: "Основно",
      items: [
        { to: "/client/dashboard", label: "Табло", icon: "🏠" },
      ],
    },
    {
      title: "Дейности",
      items: [
        { to: "/client/userevents", label: "Събития", icon: "📅" },
        { to: "/client/reports", label: "Сигнали", icon: "⚠️" },
      ],
    },
    {
      title: "Финанси",
      items: [
        { to: "/client/fees", label: "Задължения", icon: "💰" },
        { to: "/client/expenses", label: "Разходи", icon: "💸" },
        { to: "/client/buildingcash", label: "Каса", icon: "🏦" },
      ],
    },
  ];

  const isActive = (path) => {
    if (location.pathname === path) return true;
    if (path !== "/client/dashboard" && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className={`client-container ${isDarkMode ? "client-dark" : "client-light"}`}>
      
      <div 
        className={`client-overlay ${sidebarOpen ? "show" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`client-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="client-sidebar-header">
          <div className="client-brand">
            <span className="client-brand-icon">🏠</span>
            <h2 className="client-brand-text">Профи Дом - Русе</h2>
          </div>
          <button className="client-close-btn" onClick={() => setSidebarOpen(false)}>✕</button>
        </div>

        <div className="client-sidebar-scroll">
          {navConfig.map((group, index) => (
            <div key={index} className="client-nav-group">
              <h4 className="client-group-title">{group.title}</h4>
              <nav className="client-nav-list">
                {group.items.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`client-nav-item ${isActive(item.to) ? "active" : ""}`}
                  >
                    <span className="client-nav-icon">{item.icon}</span>
                    <span className="client-nav-label">{item.label}</span>
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>

        <div className="client-sidebar-footer">
          <div className="client-user-card">
            <div className="client-avatar">
              {user?.first_name?.[0] || "U"}
            </div>
            <div className="client-user-info">
              <span className="client-user-name">
                {user?.first_name || "User"} {user?.last_name || ""}
              </span>
              <span className="client-user-role">Клиент</span>
            </div>
          </div>
        </div>
      </aside>

      <div className="client-main-wrapper">
        <header className="client-top-header">
          <div className="client-header-left">
            <button className="client-menu-toggle" onClick={() => setSidebarOpen(true)}>
              ☰
            </button>
            <h2 className="client-page-title-mobile">Меню</h2>
          </div>

          <div className="client-header-right">
            <button 
              className="client-theme-btn" 
              onClick={toggleTheme}
              title={isDarkMode ? "Светъл режим" : "Тъмен режим"}
            >
              {isDarkMode ? "☀️" : "🌙"}
            </button>

            <div className="client-dropdown-container">
              <button
                className={`client-profile-btn ${dropdownOpen ? "active" : ""}`}
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <span>Моят Профил</span>
                <span className="client-arrow">▼</span>
              </button>

              {dropdownOpen && (
                <>
                  <div className="client-dropdown-overlay" onClick={() => setDropdownOpen(false)} />
                  <div className="client-dropdown-menu">
                    <div className="client-dd-header">
                      <p className="client-dd-name">{user?.first_name} {user?.last_name}</p>
                      <p className="client-dd-email">{user?.email}</p>
                    </div>
                    <Link to="/client/profile/change" className="client-dd-item" onClick={() => setDropdownOpen(false)}>
                      ⚙️ Промяна на данни
                    </Link>
                    <button onClick={handleLogout} className="client-dd-item logout">
                      🚪 Изход
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="client-content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
}