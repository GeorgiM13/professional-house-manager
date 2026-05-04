import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { useTheme } from "../../components/ThemeContext";
import {
  Building2,
  CalendarDays,
  User,
  Clock,
  AlignLeft,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react";
import "./styles/EventDetails.css";

function EventDetails({ isOpen, onClose, eventId, onEditClick }) {
  const { isDarkMode } = useTheme();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !eventId) {
      setEvent(null);
      return;
    }

    let isMounted = true;
    setLoading(true);

    async function fetchEvent() {
      const { data, error } = await supabase
        .from("events")
        .select(
          `
            id,
            status,
            subject,
            description,
            completion_date,
            created_at,
            assigned_user:assigned_to(first_name,last_name),
            building_id,
            building:building_id(name,address)
          `,
        )
        .eq("id", eventId)
        .single();

      if (isMounted) {
        if (error) {
          console.error("Supabase error:", error);
        } else {
          setEvent(data);
        }
        setLoading(false);
      }
    }
    fetchEvent();

    return () => {
      isMounted = false;
    };
  }, [isOpen, eventId]);

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
    if (s.includes("ново") || s.includes("new")) return "adm-evd-status-new";
    if (s.includes("изпълнено") || s.includes("done"))
      return "adm-evd-status-done";
    return "adm-evd-status-default";
  };

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains("au-modal-overlay")) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`au-modal-overlay ${isDarkMode ? "au-dark" : "au-light"}`}
      onClick={handleOverlayClick}
    >
      <div className="au-modal-content fade-in adm-evd-modal-custom">
        {loading ? (
          <div className="adm-evd-loading adm-evd-flex-col adm-evd-flex-center">
            <Loader2
              size={40}
              strokeWidth={2.5}
              className="adm-evd-spinner-icon"
            />
            <p>Зареждане на детайли...</p>
          </div>
        ) : !event ? (
          <div className="adm-evd-error adm-evd-flex-col adm-evd-flex-center">
            <AlertCircle size={48} strokeWidth={2} />
            <p>Събитието не е намерено.</p>
            <button className="adm-evd-close-btn-error" onClick={onClose}>
              Затвори
            </button>
          </div>
        ) : (
          <>
            <div className="adm-evd-card-header">
              <div className="adm-evd-header-top adm-evd-flex-align-between">
                <div
                  className={`adm-evd-status-pill ${getStatusClass(event.status)}`}
                >
                  {event.status || "Няма статус"}
                </div>
                <button
                  className="au-modal-close-btn"
                  onClick={onClose}
                  title="Затвори"
                >
                  <X size={24} strokeWidth={2.5} />
                </button>
              </div>

              <div className="adm-evd-title-section">
                <h1 className="adm-evd-title">{event.subject}</h1>
              </div>

              <div className="adm-evd-location-badge adm-evd-flex-align">
                <div className="adm-evd-icon-wrapper">
                  <Building2 size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h3>{event.building?.name || "Неизвестна сграда"}</h3>
                  <small>{event.building?.address || "Няма адрес"}</small>
                </div>
              </div>
            </div>

            <div className="adm-evd-divider"></div>

            <div className="adm-evd-body">
              <div className="adm-evd-description-container">
                <span className="adm-evd-section-label adm-evd-flex-align">
                  <AlignLeft size={16} strokeWidth={2.5} /> Описание на задачата
                </span>
                <div className="adm-evd-description-content">
                  {event.description || (
                    <em className="text-muted">Няма въведено описание.</em>
                  )}
                </div>
              </div>

              <div className="adm-evd-meta-grid">
                <div className="adm-evd-meta-box">
                  <div className="adm-evd-meta-icon">
                    <CalendarDays size={20} strokeWidth={2.5} />
                  </div>
                  <div className="adm-evd-meta-info">
                    <span className="adm-evd-meta-label">Краен срок</span>
                    <span className="adm-evd-meta-value adm-evd-primary-text">
                      {formatDateTime(event.completion_date)}
                    </span>
                  </div>
                </div>

                <div className="adm-evd-meta-box">
                  <div className="adm-evd-meta-icon">
                    <User size={20} strokeWidth={2.5} />
                  </div>
                  <div className="adm-evd-meta-info">
                    <span className="adm-evd-meta-label">Възложено на</span>
                    <span className="adm-evd-meta-value">
                      {event.assigned_user
                        ? `${event.assigned_user.first_name} ${event.assigned_user.last_name}`
                        : "Не е назначено"}
                    </span>
                  </div>
                </div>

                <div className="adm-evd-meta-box">
                  <div className="adm-evd-meta-icon">
                    <Clock size={20} strokeWidth={2.5} />
                  </div>
                  <div className="adm-evd-meta-info">
                    <span className="adm-evd-meta-label">Създадено на</span>
                    <span className="adm-evd-meta-value">
                      {formatDateTime(event.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="adm-evd-footer">
              <button
                className="adm-evd-btn adm-evd-btn-primary"
                onClick={() => onEditClick(event.id)}
              >
                Редактирай събитието
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default EventDetails;
