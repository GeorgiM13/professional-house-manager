import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { useTheme } from "../../components/ThemeContext";
import "./styles/UserReportDetails.css";

function UserReportDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReport() {
      const { data, error } = await supabase
        .from("reports")
        .select(
          `
          id,
          status,
          subject,
          description,
          notes,
          created_at,
          updated_at,
          building:building_id(name,address)
        `
        )
        .eq("id", id)
        .single();

      if (error) {
        console.error("Supabase error:", error);
      } else {
        setReport(data);
      }
      setLoading(false);
    }
    fetchReport();
  }, [id]);

  function formatDateTime(dateString) {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString("bg-BG", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const getStatusClass = (status) => {
    const s = status ? status.toLowerCase() : "";
    if (s.includes("ново") || s.includes("new")) return "urepd-status-new";
    if (s.includes("изпълнено") || s.includes("done"))
      return "urepd-status-done";
    if (s.includes("работ") || s.includes("progress"))
      return "urepd-status-working";
    if (s.includes("отхвърлено") || s.includes("reject"))
      return "urepd-status-rejected";
    return "urepd-status-default";
  };

  if (loading)
    return (
      <div
        className={`urepd-wrapper ${
          isDarkMode ? "client-dark" : "client-light"
        }`}
      >
        <div className="urepd-loading">
          <div className="urepd-spinner"></div>
          <p>Зареждане на сигнала...</p>
        </div>
      </div>
    );

  if (!report)
    return (
      <div
        className={`urepd-wrapper ${
          isDarkMode ? "client-dark" : "client-light"
        }`}
      >
        <div className="urepd-error">Сигналът не е намерен.</div>
      </div>
    );

  const statusClass = getStatusClass(report.status);

  return (
    <div
      className={`urepd-wrapper ${isDarkMode ? "client-dark" : "client-light"}`}
    >
      <div className="urepd-page-header">
        <button
          className="urepd-back-link"
          onClick={() => navigate("/client/reports")}
        >
          ← Назад към списъка
        </button>
        <div className={`urepd-status-pill ${statusClass}`}>
          {report.status || "Няма статус"}
        </div>
      </div>

      <div className="urepd-main-card fade-in">
        <div className="urepd-card-header">
          <div className="urepd-location-badge">
            <span className="icon">🏢</span>
            <div>
              <h3>{report.building?.name || "Неизвестна сграда"}</h3>
              <small>{report.building?.address || "Няма адрес"}</small>
            </div>
          </div>
          <div className="urepd-dates">
            <div className="date-item">
              <span>📅 Подаден на:</span>
              <strong>{formatDateTime(report.created_at)}</strong>
            </div>
          </div>
        </div>

        <div className="urepd-divider"></div>

        <div className="urepd-body">
          <h1 className="urepd-title">{report.subject}</h1>

          <div className="urepd-section-group">
            <span className="urepd-section-label">Описание на проблема</span>
            <div className="urepd-box urepd-description-box">
              {report.description}
            </div>
          </div>

          <div className="urepd-section-group">
            <span className="urepd-section-label">
              Отговор / Бележки от администратора
            </span>
            <div
              className={`urepd-box urepd-notes-box ${
                !report.notes ? "empty" : ""
              }`}
            >
              {report.notes ? (
                <>
                  <span className="admin-reply-icon">💬</span>
                  {report.notes}
                </>
              ) : (
                <em className="text-muted">
                  Все още няма добавен отговор от администратор.
                </em>
              )}
            </div>
          </div>

          <div className="urepd-meta-grid">
            <div className="urepd-meta-box">
              <span className="urepd-meta-icon">🔄</span>
              <div className="urepd-meta-info">
                <span className="urepd-meta-label">Последна промяна</span>
                <span className="urepd-meta-value">
                  {formatDateTime(report.updated_at)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserReportDetails;
