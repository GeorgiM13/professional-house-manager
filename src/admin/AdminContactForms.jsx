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

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    const d = new Date(dateString);
    const datePart = d.toLocaleDateString("bg-BG", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const timePart = d.toLocaleTimeString("bg-BG", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${datePart} ${timePart}`;
  };

  const customFormatOptionLabel = ({ label, icon: Icon }) => (
    <div className="select-option-container">
      {Icon && <Icon size={16} strokeWidth={2.5} className="select-icon" />}
      <span>{label}</span>
    </div>
  );

  return (
    <div className={`acf-page ${isDarkMode ? "acf-dark" : "acf-light"}`}>
      <div className="acf-header">
        <div className="acf-header-left">
          <h1>Контактни форми</h1>
          <p className="acf-subtitle">Входяща поща и запитвания</p>
        </div>
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
          <Select
            className="acf-react-select-container"
            classNamePrefix="acf-react-select"
            options={PERIOD_OPTIONS}
            value={getSelectValue(PERIOD_OPTIONS, filterPeriod)}
            onChange={(opt) => setFilterPeriod(opt.value)}
            formatOptionLabel={customFormatOptionLabel}
            isSearchable={false}
            placeholder="Период"
          />
        </div>
      </div>

      {loading ? (
        <div className="acf-loading">
          <Loader2 size={24} strokeWidth={2.5} className="acf-spinner-icon" />
          <span>Зареждане...</span>
        </div>
      ) : (
        <>
          <div className="acf-table-responsive desktop-view">
            <table className="acf-table">
              <thead>
                <tr>
                  <th className="acf-th-idx">№</th>
                  <th className="acf-th-sender">Подател</th>
                  <th className="acf-th-contacts">Контакти</th>
                  <th className="acf-th-message">Съобщение</th>
                  <th className="acf-th-date">Дата</th>
                </tr>
              </thead>
              <tbody>
                {paginatedMessages.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="acf-no-data">
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

                      <td>
                        <div className="acf-sender-wrapper">
                          <User
                            size={16}
                            strokeWidth={2.5}
                            className="acf-icon"
                          />
                          <span>
                            {msg.first_name} {msg.last_name}
                          </span>
                        </div>
                      </td>

                      <td className="acf-contacts">
                        <div className="contact-row">
                          <Mail
                            size={14}
                            strokeWidth={2.5}
                            className="acf-icon-sm"
                          />
                          <span>{msg.email}</span>
                        </div>
                        <div className="contact-row">
                          <Phone
                            size={14}
                            strokeWidth={2.5}
                            className="acf-icon-sm"
                          />
                          <span>{msg.phone}</span>
                        </div>
                      </td>

                      <td className="acf-message-cell">{msg.message}</td>

                      <td className="acf-date-cell">
                        {formatDateTime(msg.created_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="acf-mobile-list mobile-view">
            {paginatedMessages.map((msg) => (
              <div
                key={msg.id}
                className="acf-mobile-card"
                onClick={() => navigate(`/admin/message/${msg.id}`)}
              >
                <div className="acf-card-header">
                  <div className="acf-card-title">
                    <User
                      size={18}
                      strokeWidth={2.5}
                      className="acf-card-icon"
                    />
                    {msg.first_name} {msg.last_name}
                  </div>
                  <span className="acf-card-date">
                    {formatDateTime(msg.created_at)}
                  </span>
                </div>

                <div className="acf-card-subtitle">
                  <Mail size={16} strokeWidth={2.5} className="acf-icon-sm" />
                  <span>{msg.email}</span>
                </div>
                <div className="acf-card-subtitle">
                  <Phone size={16} strokeWidth={2.5} className="acf-icon-sm" />
                  <span>{msg.phone}</span>
                </div>

                <div className="acf-card-message">{msg.message}</div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="acf-pagination">
              <button
                className="acf-pagination-btn prev-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                <ChevronLeft
                  size={18}
                  strokeWidth={2.5}
                  className="acf-icon-slide-left"
                />
                <span className="acf-pagination-btn-text">Предишна</span>
              </button>

              <div className="acf-pagination-info">
                <span className="acf-page-word">Страница </span>
                <span className="acf-page-numbers">
                  {currentPage}
                  <span className="acf-page-separator"> от </span>
                  <span className="acf-page-slash"> / </span>
                  {totalPages}
                </span>
              </div>

              <button
                className="acf-pagination-btn next-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                <span className="acf-pagination-btn-text">Следваща</span>
                <ChevronRight
                  size={18}
                  strokeWidth={2.5}
                  className="acf-icon-slide-right"
                />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
