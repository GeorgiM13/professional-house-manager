import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { useTheme } from "../../components/ThemeContext";
import "./styles/ReportDetails.css";

function ReportDetails() {
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
            updated_at,
            created_at,
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
    if (s.includes("нов") || s.includes("new")) return "status-new";
    if (s.includes("работ") || s.includes("progress")) return "status-progress";
    if (s.includes("приключ") || s.includes("done") || s.includes("closed"))
      return "status-done";
    if (s.includes("отказ") || s.includes("reject")) return "status-reject";
    return "status-default";
  };

  const goBack = () => navigate("/admin/reports");

  if (loading) {
    return (
      <div className={`rpd-wrapper ${isDarkMode ? "au-dark" : "au-light"}`}>
        <div className="rpd-loading">
          <div className="spinner"></div>
          <p>Зареждане на сигнала...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className={`rpd-wrapper ${isDarkMode ? "au-dark" : "au-light"}`}>
        <div className="rpd-error">
          Сигналът не е намерен.
          <br />
          <br />
          <button className="rpd-back-link" onClick={goBack}>
            ← Назад
          </button>
        </div>
      </div>
    );
  }

  const statusClass = getStatusClass(report.status);

  return (
    <div className={`rpd-wrapper ${isDarkMode ? "au-dark" : "au-light"}`}>
      <div className="rpd-page-header">
        <button className="rpd-back-link" onClick={goBack}>
          ← Назад към списъка
        </button>
        <div className={`rpd-status-pill ${statusClass}`}>
          {report.status || "Няма статус"}
        </div>
      </div>

      <div className="rpd-main-card fade-in">
        <div className="rpd-card-header">
          <div className="rpd-location-badge">
            <span className="icon">📢</span>
            <div>
              <h3>{report.building?.name || "Неизвестна сграда"}</h3>
              <small>{report.building?.address || "Няма адрес"}</small>
            </div>
          </div>
          <div className="rpd-dates">
            <div className="date-item">
              <span>🕒 Последна промяна:</span>
              <strong>{formatDateTime(report.updated_at)}</strong>
            </div>
          </div>
        </div>

        <div className="rpd-divider"></div>

        <div className="rpd-body">
          <h1 className="rpd-title">{report.subject}</h1>

          <div className="rpd-description-container">
            <span className="rpd-section-label">Описание на проблема</span>
            <div className="rpd-description-content">
              {report.description || (
                <em className="text-muted">Няма въведено описание.</em>
              )}
            </div>
          </div>

          {report.notes && (
            <div className="rpd-notes-box">
              <span className="rpd-notes-label">
                🔒 Административни бележки
              </span>
              <div className="rpd-notes-content">{report.notes}</div>
            </div>
          )}

          <div className="rpd-meta-grid">
            <div className="meta-box">
              <span className="meta-icon">📅</span>
              <div className="meta-info">
                <span className="meta-label">Дата на създаване</span>
                <span className="meta-value">
                  {formatDateTime(report.created_at)}
                </span>
              </div>
            </div>

            <div className="meta-box">
              <span className="meta-icon">🆔</span>
              <div className="meta-info">
                <span className="meta-label">ID на сигнала</span>
                <span className="meta-value mono">#{report.id}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rpd-footer">
          <button
            className="rpd-btn rpd-btn-primary"
            onClick={() => navigate(`/admin/editreport/${report.id}`)}
          >
            ✏️ Редактирай сигнала
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReportDetails;
