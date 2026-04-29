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
import "./styles/UserReportDetails.css";

function UserReportDetails({ reportId, isOpen, onClose }) {
  const { isDarkMode } = useTheme();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReport() {
      if (!isOpen || !reportId) return;

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
  }, [reportId, isOpen]);

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

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains("urepd-modal-overlay")) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`urepd-modal-overlay ${isDarkMode ? "client-dark" : "client-light"}`}
      onClick={handleOverlayClick}
    >
      <div className="urepd-modal-content fade-in">
        {loading ? (
          <div className="urepd-loading urepd-flex-col urepd-flex-center">
            <Loader2
              size={40}
              strokeWidth={2.5}
              className="urepd-spinner-icon"
            />
            <p>Зареждане на детайли...</p>
          </div>
        ) : !report ? (
          <div className="urepd-error urepd-flex-col urepd-flex-center">
            <AlertCircle size={48} strokeWidth={2} />
            <p>Сигналът не е намерен.</p>
            <button className="urepd-close-btn-error" onClick={onClose}>
              Затвори
            </button>
          </div>
        ) : (
          <>
            <div className="urepd-card-header">
              <div className="urepd-header-top urepd-flex-align">
                <div
                  className={`urepd-status-pill ${getStatusClass(report.status)}`}
                >
                  {report.status || "Няма статус"}
                </div>
                <button
                  className="urepd-close-btn"
                  onClick={onClose}
                  title="Затвори"
                >
                  <X size={24} strokeWidth={2.5} />
                </button>
              </div>

              <div className="urepd-title-section">
                <h1 className="urepd-title">{report.subject}</h1>
              </div>

              <div className="urepd-location-badge urepd-flex-align">
                <div className="urepd-icon-wrapper">
                  <Building2 size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h3>{report.building?.name || "Неизвестна сграда"}</h3>
                  <small>{report.building?.address || "Няма адрес"}</small>
                </div>
              </div>
            </div>

            <div className="urepd-divider"></div>

            <div className="urepd-body">
              <div className="urepd-description-container">
                <span className="urepd-section-label urepd-flex-align">
                  <AlignLeft size={16} strokeWidth={2.5} /> Описание на проблема
                </span>
                <div className="urepd-description-content">
                  {report.description || (
                    <em className="text-muted">Няма въведено описание.</em>
                  )}
                </div>
              </div>

              <div className="urepd-description-container">
                <span className="urepd-section-label urepd-flex-align">
                  <MessageSquare size={16} strokeWidth={2.5} /> Отговор от
                  администратор
                </span>
                <div
                  className={`urepd-description-content ${!report.notes ? "empty-notes" : "admin-notes"}`}
                >
                  {report.notes ? (
                    report.notes
                  ) : (
                    <em className="text-muted">
                      Все още няма добавен отговор от администратор.
                    </em>
                  )}
                </div>
              </div>

              <div className="urepd-meta-grid">
                <div className="urepd-meta-box">
                  <div className="urepd-meta-icon">
                    <CalendarDays size={20} strokeWidth={2.5} />
                  </div>
                  <div className="urepd-meta-info">
                    <span className="urepd-meta-label">Подаден на</span>
                    <span className="urepd-meta-value urepd-primary-text">
                      {formatDateTime(report.created_at)}
                    </span>
                  </div>
                </div>

                <div className="urepd-meta-box">
                  <div className="urepd-meta-icon">
                    <RefreshCw size={20} strokeWidth={2.5} />
                  </div>
                  <div className="urepd-meta-info">
                    <span className="urepd-meta-label">Последна промяна</span>
                    <span className="urepd-meta-value">
                      {formatDateTime(report.updated_at)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default UserReportDetails;
