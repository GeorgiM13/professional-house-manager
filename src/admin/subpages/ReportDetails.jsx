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
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const getStatusStyle = (status) => {
    const s = status ? status.toLowerCase() : "";
    if (s.includes("нов") || s.includes("new"))
      return { bg: "#dbeafe", color: "#1e40af", border: "#93c5fd" };
    if (s.includes("работ") || s.includes("in progress"))
      return { bg: "#fef9c3", color: "#854d0e", border: "#fde047" };
    if (s.includes("приключ") || s.includes("done") || s.includes("closed"))
      return { bg: "#dcfce7", color: "#166534", border: "#86efac" };
    if (s.includes("отказ") || s.includes("reject"))
      return { bg: "#fee2e2", color: "#991b1b", border: "#fca5a5" };

    return {
      bg: isDarkMode ? "#334155" : "#f1f5f9",
      color: isDarkMode ? "#e2e8f0" : "#475569",
      border: isDarkMode ? "#475569" : "#cbd5e1",
    };
  };

  const goBack = () => navigate("/admin/reports");

  if (loading) {
    return (
      <div className={`rpd-container ${isDarkMode ? "au-dark" : "au-light"}`}>
        <div
          style={{
            textAlign: "center",
            padding: "4rem",
            color: "var(--au-text-sec)",
          }}
        >
          Зареждане на сигнала...
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className={`rpd-container ${isDarkMode ? "au-dark" : "au-light"}`}>
        <div style={{ textAlign: "center", padding: "4rem" }}>
          Сигналът не е намерен.
          <br />
          <br />
          <button className="rpd-btn rpd-btn-secondary" onClick={goBack}>
            Назад
          </button>
        </div>
      </div>
    );
  }

  const statusStyle = getStatusStyle(report.status);

  return (
    <div className={`rpd-container ${isDarkMode ? "au-dark" : "au-light"}`}>
      <div className="rpd-header">
        <div>
          <h1>Преглед на сигнал</h1>
          <p>Детайлна информация и история</p>
        </div>
        <button className="rpd-btn rpd-btn-secondary" onClick={goBack}>
          Назад към списъка
        </button>
      </div>

      <div className="rpd-card">
        <div className="rpd-top-section">
          <div className="rpd-location-group">
            <h3>{report.building?.name || "Неизвестна сграда"}</h3>
            <span>📍 {report.building?.address || "Няма адрес"}</span>
          </div>

          <div
            className="rpd-badge"
            style={{
              backgroundColor: statusStyle.bg,
              color: statusStyle.color,
              border: `1px solid ${statusStyle.border}`,
            }}
          >
            {report.status || "Няма статус"}
          </div>
        </div>

        <div className="rpd-content-section">
          <div>
            <span className="rpd-label">Относно</span>
            <div className="rpd-subject">{report.subject}</div>
          </div>

          <div>
            <span className="rpd-label">Описание</span>
            <div className="rpd-description-box">
              {report.description || <em>Няма въведено описание.</em>}
            </div>
          </div>
        </div>

        <div className="rpd-meta-grid">
          <div className="rpd-meta-item">
            <span className="rpd-label">Дата на създаване</span>
            <span className="rpd-meta-value">
              {formatDateTime(report.created_at)}
            </span>
          </div>
          <div className="rpd-meta-item">
            <span className="rpd-label">Последна промяна</span>
            <span className="rpd-meta-value">
              {formatDateTime(report.updated_at)}
            </span>
          </div>
          <div className="rpd-meta-item">
            <span className="rpd-label">ID на сигнала</span>
            <span
              className="rpd-meta-value"
              style={{ fontFamily: "monospace" }}
            >
              #{report.id}
            </span>
          </div>
        </div>

        {report.notes && (
          <div className="rpd-notes-section">
            <span className="rpd-label" style={{ color: "#854d0e" }}>
              🔒 Административни бележки
            </span>
            <div style={{ marginTop: "0.5rem", color: "var(--au-text-main)" }}>
              {report.notes}
            </div>
          </div>
        )}

        <div className="rpd-actions">
          <button className="rpd-btn rpd-btn-secondary" onClick={goBack}>
            Назад
          </button>
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
