import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useState, useEffect } from "react";
import { useTheme } from "../components/ThemeContext";

import logoLight from "../components/assets/logo.svg";
import logoDark from "../components/assets/logo_dark.svg";

import {
  CalendarDays,
  TriangleAlert,
  Mail,
  CircleDollarSign,
  ReceiptText,
  Landmark,
  Building,
  Users,
  Settings,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  ChevronRight,
  ChevronUp,
} from "lucide-react";
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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (window.innerWidth <= 768) {
      document.body.style.overflow = sidebarOpen ? "hidden" : "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
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
        {
          to: "/admin/adminevents",
          label: "Събития",
          icon: <CalendarDays size={20} strokeWidth={2.5} />,
        },
        {
          to: "/admin/reports",
          label: "Сигнали",
          icon: <TriangleAlert size={20} strokeWidth={2.5} />,
        },
        {
          to: "/admin/contactforms",
          label: "Контактни форми",
          icon: <Mail size={20} strokeWidth={2.5} />,
        },
      ],
    },
    {
      title: "Финанси",
      items: [
        {
          to: "/admin/fees",
          label: "Такси",
          icon: <CircleDollarSign size={20} strokeWidth={2.5} />,
        },
        {
          to: "/admin/expenses",
          label: "Разходи",
          icon: <ReceiptText size={20} strokeWidth={2.5} />,
        },
        {
          to: "/admin/buildingcash",
          label: "Каса",
          icon: <Landmark size={20} strokeWidth={2.5} />,
        },
      ],
    },
    {
      title: "Администрация",
      items: [
        {
          to: "/admin/buildings",
          label: "Сгради",
          icon: <Building size={20} strokeWidth={2.5} />,
        },
        {
          to: "/admin/users",
          label: "Потребители",
          icon: <Users size={20} strokeWidth={2.5} />,
        },
        {
          to: "/admin/users-building",
          label: "Потребители по сгради",
          icon: <Users size={20} strokeWidth={2.5} />,
        },
      ],
    },
  ];

  const isActive = (path) => {
    if (location.pathname === path) return true;
    if (location.pathname.startsWith(path + "/")) return true;
    return false;
  };

  return (
    <div
      className={`admin-container ${isDarkMode ? "admin-dark" : "admin-light"}`}
    >
      <div
        className={`admin-overlay ${sidebarOpen ? "show" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="admin-sidebar-header">
          <div className="admin-brand">
            <img
              src={isDarkMode ? logoDark : logoLight}
              alt="Профи Дом Русе"
              className="admin-brand-logo"
            />
          </div>
          <button
            className="admin-close-btn"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={24} strokeWidth={2.5} />
          </button>
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
          <div 
            className={`admin-dropdown-overlay ${dropdownOpen ? "open" : ""}`} 
            onClick={() => setDropdownOpen(false)} 
          />
          <div className={`admin-footer-dropdown-menu ${dropdownOpen ? "open" : ""}`}>
            <div className="admin-dd-header">
              <p className="admin-dd-name">{user?.first_name} {user?.last_name}</p>
              <p className="admin-dd-email">{user?.email}</p>
            </div>
            <Link to="/admin/profile/change" className="admin-dd-item" onClick={() => setDropdownOpen(false)}>
              <Settings size={16} strokeWidth={2.5} className="admin-dd-icon" /> Настройки
            </Link>
            <button onClick={handleLogout} className="admin-dd-item logout">
              <LogOut size={16} strokeWidth={2.5} className="admin-dd-icon" /> Изход
            </button>
          </div>

          <div 
            className={`admin-user-card ${dropdownOpen ? "active" : ""}`}
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <div className="admin-avatar">
              {user?.first_name?.[0] || "A"}
            </div>
            <div className="admin-user-info">
              <span className="admin-user-name">
                {user?.first_name || "Admin"} {user?.last_name || ""}
              </span>
              <span className="admin-user-role">Администратор</span>
            </div>
            {isMobile ? (
              <ChevronUp size={18} strokeWidth={2.5} className={`admin-user-chevron ${dropdownOpen ? "open-mobile" : ""}`} />
            ) : (
              <ChevronRight size={18} strokeWidth={2.5} className={`admin-user-chevron ${dropdownOpen ? "open-desktop" : ""}`} />
            )}
          </div>
        </div>
      </aside>

      <div className="admin-main-wrapper">
        <header className="admin-top-header">
          <div className="admin-header-left">
            <button
              className="admin-menu-toggle"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={24} strokeWidth={2.5} />
            </button>
            <h2 className="admin-page-title-mobile">Табло</h2>
          </div>

          <div className="admin-header-right">
            <button
              className="admin-theme-btn"
              onClick={toggleTheme}
              title={isDarkMode ? "Светъл режим" : "Тъмен режим"}
            >
              {isDarkMode ? (
                <Sun size={22} strokeWidth={2.5} />
              ) : (
                <Moon size={22} strokeWidth={2.5} />
              )}
            </button>
          </div>
        </header>

        <main className="admin-content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
