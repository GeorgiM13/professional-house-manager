import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { useTheme } from "../../components/ThemeContext";
import {
  Building2,
  CalendarDays,
  AlignLeft,
  MessageSquare,
  RefreshCw,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react";
import "./styles/ReportDetails.css";

function ReportDetails({ reportId, onClose, onEdit }) {
  const { isDarkMode } = useTheme();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReport() {
      if (!reportId) return;

      setLoading(true);
      setReport(null);

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
            building_id,
            building:building_id(name,address)
          `,
        )
        .eq("id", reportId)
        .single();

      if (error) {
        console.error("Supabase error:", error);
      } else {
        setReport(data);
      }
      setLoading(false);
    }
    fetchReport();
  }, [reportId]);

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
    if (s.includes("ново") || s.includes("new")) return "adm-repdet-status-new";
    if (s.includes("изпълнено") || s.includes("done"))
      return "adm-repdet-status-done";
    if (s.includes("работ") || s.includes("progress"))
      return "adm-repdet-status-working";
    if (s.includes("отхвърлено") || s.includes("reject"))
      return "adm-repdet-status-rejected";
    return "adm-repdet-status-default";
  };

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains("adm-repdet-modal-overlay")) {
      onClose();
    }
  };

  if (!reportId) return null;

  return (
    <div
      className={`adm-repdet-modal-overlay ${isDarkMode ? "adm-repdet-dark" : "adm-repdet-light"}`}
      onClick={handleOverlayClick}
    >
      <div className="adm-repdet-modal-content adm-repdet-fade-in">
        {loading ? (
          <div className="adm-repdet-loading adm-repdet-flex-col adm-repdet-flex-center">
            <Loader2
              size={40}
              strokeWidth={2.5}
              className="adm-repdet-spinner-icon"
            />
            <p>Зареждане на детайли...</p>
          </div>
        ) : !report ? (
          <div className="adm-repdet-error adm-repdet-flex-col adm-repdet-flex-center">
            <AlertCircle size={48} strokeWidth={2} />
            <p>Сигналът не е намерен.</p>
            <button className="adm-repdet-close-btn-error" onClick={onClose}>
              Затвори
            </button>
          </div>
        ) : (
          <>
            <div className="adm-repdet-card-header">
              <div className="adm-repdet-header-top adm-repdet-flex-align">
                <div
                  className={`adm-repdet-status-pill ${getStatusClass(report.status)}`}
                >
                  {report.status || "Няма статус"}
                </div>
                <button
                  className="adm-repdet-close-btn"
                  onClick={onClose}
                  title="Затвори"
                >
                  <X size={24} strokeWidth={2.5} />
                </button>
              </div>

              <div className="adm-repdet-title-section">
                <h1 className="adm-repdet-title">{report.subject}</h1>
              </div>

              <div className="adm-repdet-location-badge adm-repdet-flex-align">
                <div className="adm-repdet-icon-wrapper">
                  <Building2 size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h3>{report.building?.name || "Неизвестна сграда"}</h3>
                  <small>{report.building?.address || "Няма адрес"}</small>
                </div>
              </div>
            </div>

            <div className="adm-repdet-divider"></div>

            <div className="adm-repdet-body">
              <div className="adm-repdet-description-container">
                <span className="adm-repdet-section-label adm-repdet-flex-align">
                  <AlignLeft size={16} strokeWidth={2.5} /> Описание на проблема
                </span>
                <div className="adm-repdet-description-content">
                  {report.description || (
                    <em className="adm-repdet-text-muted">
                      Няма въведено описание.
                    </em>
                  )}
                </div>
              </div>

              <div className="adm-repdet-description-container">
                <span className="adm-repdet-section-label adm-repdet-flex-align">
                  <MessageSquare size={16} strokeWidth={2.5} /> Административни
                  бележки
                </span>
                <div
                  className={`adm-repdet-description-content ${
                    !report.notes
                      ? "adm-repdet-empty-notes"
                      : "adm-repdet-admin-notes"
                  }`}
                >
                  {report.notes ? (
                    report.notes
                  ) : (
                    <em className="adm-repdet-text-muted">
                      Все още няма добавен отговор/бележки.
                    </em>
                  )}
                </div>
              </div>

              <div className="adm-repdet-meta-grid">
                <div className="adm-repdet-meta-box">
                  <div className="adm-repdet-meta-icon">
                    <CalendarDays size={20} strokeWidth={2.5} />
                  </div>
                  <div className="adm-repdet-meta-info">
                    <span className="adm-repdet-meta-label">Подаден на</span>
                    <span className="adm-repdet-meta-value adm-repdet-primary-text">
                      {formatDateTime(report.created_at)}
                    </span>
                  </div>
                </div>

                <div className="adm-repdet-meta-box">
                  <div className="adm-repdet-meta-icon">
                    <RefreshCw size={20} strokeWidth={2.5} />
                  </div>
                  <div className="adm-repdet-meta-info">
                    <span className="adm-repdet-meta-label">
                      Последна промяна
                    </span>
                    <span className="adm-repdet-meta-value">
                      {formatDateTime(report.updated_at)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="adm-repdet-footer">
              <button className="adm-repdet-edit-btn" onClick={onEdit}>
                Редактирай сигнала
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ReportDetails;
