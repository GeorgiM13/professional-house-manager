import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import { supabase } from "../supabaseClient";
import { useTheme } from "../components/ThemeContext";
import {
  Calendar,
  Mail,
  TrendingUp,
  User,
  Phone,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import "./styles/AdminContactForms.css";

const CountUp = ({ value, duration = 800, decimals = 0 }) => {
  const [displayValue, setDisplayValue] = useState(0);
  useEffect(() => {
    let start = 0;
    let startTime = null;
    let frame;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      const current = start + (value - start) * easeProgress;
      setDisplayValue(current);
      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);
  return <>{displayValue.toFixed(decimals)}</>;
};

const PERIOD_OPTIONS = [
  { value: "all", label: "Всички периоди", icon: Calendar },
  { value: "today", label: "Днес", icon: Calendar },
  { value: "week", label: "Тази седмица", icon: Calendar },
  { value: "month", label: "Този месец", icon: Calendar },
];

const CUSTOM_SELECT_STYLES = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: "var(--acf-bg-card)",
    borderColor: state.isFocused ? "var(--acf-accent)" : "var(--acf-border)",
    borderRadius: "8px",
    color: "var(--acf-text-main)",
    boxShadow: state.isFocused ? "0 0 0 2px var(--acf-accent-light)" : "none",
  }),
  menu: (provided) => ({
    ...provided,
    zIndex: 9999,
    backgroundColor: "var(--acf-bg-card)",
  }),
  singleValue: (provided) => ({ ...provided, color: "var(--acf-text-main)" }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "var(--acf-accent)"
      : state.isFocused
        ? "var(--acf-bg-page)"
        : "transparent",
    color: state.isSelected ? "white" : "var(--acf-text-main)",
    cursor: "pointer",
  }),
};

const customFormatOptionLabel = ({ label, icon: Icon }) => (
  <div className="select-option-container">
    {Icon && <Icon size={18} strokeWidth={2.5} className="select-icon" />}
    <span>{label}</span>
  </div>
);

export default function AdminContactForms() {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, today: 0, week: 0 });
  const [filterPeriod, setFilterPeriod] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    async function fetchMessages() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("contact_messages")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        const allData = data || [];
        setMessages(allData);
        calculateStats(allData);
      } catch (err) {
        console.error("Error fetching messages:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchMessages();
  }, []);

  const calculateStats = (data) => {
    const now = new Date();
    const todayStr = now.toDateString();

    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay() || 7;
    if (day !== 1) startOfWeek.setHours(-24 * (day - 1));
    startOfWeek.setHours(0, 0, 0, 0);

    const total = data.length;
    const todayCount = data.filter(
      (m) => new Date(m.created_at).toDateString() === todayStr,
    ).length;
    const weekCount = data.filter(
      (m) => new Date(m.created_at) >= startOfWeek,
    ).length;

    setStats({ total, today: todayCount, week: weekCount });
  };

  const filteredMessages = useMemo(() => {
    let data = [...messages];
    const now = new Date();
    const todayStr = now.toDateString();

    if (filterPeriod === "today") {
      data = data.filter(
        (m) => new Date(m.created_at).toDateString() === todayStr,
      );
    } else if (filterPeriod === "week") {
      const startOfWeek = new Date(now);
      const day = startOfWeek.getDay() || 7;
      if (day !== 1) startOfWeek.setHours(-24 * (day - 1));
      startOfWeek.setHours(0, 0, 0, 0);
      data = data.filter((m) => new Date(m.created_at) >= startOfWeek);
    } else if (filterPeriod === "month") {
      data = data.filter((m) => {
        const d = new Date(m.created_at);
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      });
    }

    return data;
  }, [messages, filterPeriod]);

  const paginatedMessages = filteredMessages.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const totalPages = Math.ceil(filteredMessages.length / pageSize);

  const getSelectValue = (options, value) =>
    options.find((o) => String(o.value) === String(value)) || options[0];

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const d = new Date(dateString);

    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const yearFull = d.getFullYear();
    const yearShort = String(yearFull).slice(-2);
    const time = d.toLocaleTimeString("bg-BG", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <>
        <span className="date-desktop">
          {day}.{month}.{yearFull} г.{" "}
          <span className="acf-date-time">{time}</span>
        </span>

        <div className="date-mobile">
          <div className="dm-date">
            {day}.{month}.{yearShort}
          </div>
          <div className="dm-time">{time}</div>
        </div>
      </>
    );
  };

  return (
    <div className={`acf-page ${isDarkMode ? "acf-dark" : "acf-light"}`}>
      <div className="acf-header">
        <div className="acf-header-left">
          <h1>Контактни форми</h1>
          <p className="acf-subtitle">Входяща поща и запитвания</p>
        </div>
        <div className="acf-header-right"></div>
      </div>

      <div className="acf-stats-grid">
        <div className="acf-stat-card blue">
          <div className="acf-stat-icon">
            <Mail size={24} strokeWidth={2.5} className="acf-stat-svg" />
          </div>
          <div className="acf-stat-info">
            <span className="acf-stat-label">Общо съобщения</span>
            <span className="acf-stat-value">
              <CountUp value={stats.total} /> <small>бр.</small>
            </span>
          </div>
        </div>
        <div className="acf-stat-card purple">
          <div className="acf-stat-icon">
            <Calendar size={24} strokeWidth={2.5} className="acf-stat-svg" />
          </div>
          <div className="acf-stat-info">
            <span className="acf-stat-label">Днес</span>
            <span className="acf-stat-value">
              <CountUp value={stats.today} /> <small>бр.</small>
            </span>
          </div>
        </div>
        <div className="acf-stat-card green">
          <div className="acf-stat-icon">
            <TrendingUp size={24} strokeWidth={2.5} className="acf-stat-svg" />
          </div>
          <div className="acf-stat-info">
            <span className="acf-stat-label">Тази седмица</span>
            <span className="acf-stat-value">
              <CountUp value={stats.week} /> <small>бр.</small>
            </span>
          </div>
        </div>
      </div>

      <div className="acf-toolbar">
        <h3>Списък съобщения</h3>
        <div className="acf-filters-right">
          <div className="acf-filter-wrapper">
            <Select
              options={PERIOD_OPTIONS}
              value={getSelectValue(PERIOD_OPTIONS, filterPeriod)}
              onChange={(opt) => setFilterPeriod(opt.value)}
              styles={CUSTOM_SELECT_STYLES}
              formatOptionLabel={customFormatOptionLabel}
              isSearchable={false}
              placeholder="Период"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="acf-loading">
          <Loader2 size={24} strokeWidth={2.5} className="acf-spinner-icon" />
          <span>Зареждане...</span>
        </div>
      ) : (
        <>
          <table className="acf-table">
            <thead>
              <tr>
                <th>№</th>
                <th>Подател</th>
                <th>Контакти</th>
                <th>Съобщение</th>
                <th>Дата</th>
              </tr>
            </thead>
            <tbody>
              {paginatedMessages.length === 0 ? (
                <tr>
                  <td colSpan="6" className="acf-no-data">
                    Няма намерени съобщения за избрания период.
                  </td>
                </tr>
              ) : (
                paginatedMessages.map((msg, idx) => (
                  <tr
                    key={msg.id}
                    onClick={() => navigate(`/admin/message/${msg.id}`)}
                    className="acf-row"
                  >
                    <td className="acf-idx">
                      {(currentPage - 1) * pageSize + idx + 1}
                    </td>

                    <td data-label="Подател" className="acf-sender">
                      <User size={16} strokeWidth={2.5} className="acf-icon" />
                      {msg.first_name} {msg.last_name}
                    </td>

                    <td data-label="Контакти" className="acf-contacts">
                      <div className="contact-row">
                        <Mail
                          size={14}
                          strokeWidth={2.5}
                          className="acf-icon-sm"
                        />
                        {msg.email}
                      </div>
                      <div className="contact-row">
                        <Phone
                          size={14}
                          strokeWidth={2.5}
                          className="acf-icon-sm"
                        />
                        {msg.phone}
                      </div>
                    </td>

                    <td data-label="Съобщение" className="acf-message-cell">
                      {msg.message}
                    </td>

                    <td data-label="Дата">{formatDate(msg.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="acf-pagination">
              <button
                className="acf-pagination-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                <ChevronLeft size={18} strokeWidth={2.5} />
                Предишна
              </button>
              <span className="acf-pagination-info">
                Страница {currentPage} от {totalPages}
              </span>
              <button
                className="acf-pagination-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Следваща
                <ChevronRight size={18} strokeWidth={2.5} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
