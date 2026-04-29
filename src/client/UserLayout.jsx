import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useState, useEffect, useRef } from "react";
import { useTheme } from "../components/ThemeContext";
import {
  Home,
  CalendarDays,
  AlertTriangle,
  Banknote,
  ReceiptText,
  Wallet,
  Settings,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  User as UserIcon,
} from "lucide-react";

import logoLight from "../components/assets/logo.svg";
import logoDark from "../components/assets/logo_dark.svg";
import "./styles/UserLayout.css";

export default function UserLayout() {
  const { isDarkMode, toggleTheme } = useTheme();

  const [user, setUser] = useState({});
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (window.innerWidth <= 1024) {
      document.body.style.overflow = sidebarOpen ? "hidden" : "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [sidebarOpen]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        {
          to: "/client/dashboard",
          label: "Табло",
          icon: <Home size={20} strokeWidth={2.5} />,
        },
      ],
    },
    {
      title: "Дейности",
      items: [
        {
          to: "/client/userevents",
          label: "Събития",
          icon: <CalendarDays size={20} strokeWidth={2.5} />,
        },
        {
          to: "/client/reports",
          label: "Сигнали",
          icon: <AlertTriangle size={20} strokeWidth={2.5} />,
        },
      ],
    },
    {
      title: "Финанси",
      items: [
        {
          to: "/client/fees",
          label: "Задължения",
          icon: <Banknote size={20} strokeWidth={2.5} />,
        },
        {
          to: "/client/expenses",
          label: "Разходи",
          icon: <ReceiptText size={20} strokeWidth={2.5} />,
        },
        {
          to: "/client/buildingcash",
          label: "Каса",
          icon: <Wallet size={20} strokeWidth={2.5} />,
        },
      ],
    },
  ];

  const isActive = (path) => {
    if (location.pathname === path) return true;
    if (path !== "/client/dashboard" && location.pathname.startsWith(path))
      return true;
    return false;
  };

  return (
    <div
      className={`client-container ${isDarkMode ? "client-dark" : "client-light"}`}
    >
      <div
        className={`client-overlay ${sidebarOpen ? "show" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`client-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="client-sidebar-header flex-align">
          <div className="client-brand flex-align">
            <img
              src={isDarkMode ? logoDark : logoLight}
              alt="Профи Дом Русе"
              className="client-brand-logo"
            />
          </div>
          <button
            className="client-close-btn"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={24} strokeWidth={2.5} />
          </button>
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
                    className={`client-nav-item flex-align ${isActive(item.to) ? "active" : ""}`}
                  >
                    <span className="client-nav-icon flex-align">
                      {item.icon}
                    </span>
                    <span className="client-nav-label">{item.label}</span>
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>

        <div className="client-sidebar-footer" ref={dropdownRef}>
          <div className="client-user-card-wrapper">
            {dropdownOpen && (
              <div className="client-user-dropdown">
                <div className="client-dd-header">
                  <p className="client-dd-name">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="client-dd-email">{user?.email}</p>
                </div>
                <Link
                  to="/client/profile/change"
                  className="client-dd-item flex-align"
                  onClick={() => setDropdownOpen(false)}
                >
                  <Settings size={18} strokeWidth={2.5} /> Промяна на данни
                </Link>
                <button
                  onClick={handleLogout}
                  className="client-dd-item logout flex-align"
                >
                  <LogOut size={18} strokeWidth={2.5} /> Изход
                </button>
              </div>
            )}

            <div
              className={`client-user-card flex-align ${dropdownOpen ? "active" : ""}`}
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <div className="client-avatar flex-align">
                {user?.first_name ? (
                  user.first_name[0].toUpperCase()
                ) : (
                  <UserIcon size={20} strokeWidth={2.5} />
                )}
              </div>
              <div className="client-user-info">
                <span className="client-user-name">
                  {user?.first_name || "Потребител"} {user?.last_name || ""}
                </span>
                <span className="client-user-role">Клиент</span>
              </div>
              <div className="client-user-chevron flex-align">
                <ChevronRight
                  size={18}
                  strokeWidth={2.5}
                  className={`chevron-desktop ${dropdownOpen ? "rotate" : ""}`}
                />

                <div className="chevron-mobile">
                  {dropdownOpen ? (
                    <ChevronDown size={18} strokeWidth={2.5} />
                  ) : (
                    <ChevronUp size={18} strokeWidth={2.5} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="client-main-wrapper">
        <header className="client-top-header flex-align-between">
          <div className="client-header-left flex-align">
            <button
              className="client-menu-toggle"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={24} strokeWidth={2.5} />
            </button>
            <h2 className="client-page-title-mobile">Меню</h2>
          </div>

          <div className="client-header-right flex-align">
            <button
              className="client-theme-btn flex-align"
              onClick={toggleTheme}
              title={
                isDarkMode
                  ? "Премини към светъл режим"
                  : "Премини към тъмен режим"
              }
            >
              {isDarkMode ? (
                <Sun size={22} strokeWidth={2.5} />
              ) : (
                <Moon size={22} strokeWidth={2.5} />
              )}
            </button>
          </div>
        </header>

        <main className="client-content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
}