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
import "./styles/UserEventDetails.css";

function UserEventDetails({ eventId, onClose }) {
  const { isDarkMode } = useTheme();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvent() {
      if (!eventId) return;

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

      if (error) {
        console.error("Supabase error:", error);
      } else {
        setEvent(data);
      }
      setLoading(false);
    }
    fetchEvent();
  }, [eventId]);

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
    if (s.includes("ново") || s.includes("new")) return "uevd-status-new";
    if (s.includes("изпълнено") || s.includes("done"))
      return "uevd-status-done";
    return "uevd-status-default";
  };

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains("uevd-modal-overlay")) {
      onClose();
    }
  };

  return (
    <div
      className={`uevd-modal-overlay ${isDarkMode ? "client-dark" : "client-light"}`}
      onClick={handleOverlayClick}
    >
      <div className="uevd-modal-content fade-in">
        {loading ? (
          <div className="uevd-loading uevd-flex-col uevd-flex-center">
            <Loader2
              size={40}
              strokeWidth={2.5}
              className="uevd-spinner-icon"
            />
            <p>Зареждане на детайли...</p>
          </div>
        ) : !event ? (
          <div className="uevd-error uevd-flex-col uevd-flex-center">
            <AlertCircle size={48} strokeWidth={2} />
            <p>Събитието не е намерено.</p>
            <button className="uevd-close-btn-error" onClick={onClose}>
              Затвори
            </button>
          </div>
        ) : (
          <>
            <div className="uevd-card-header">
              <div className="uevd-header-top uevd-flex-align">
                <div
                  className={`uevd-status-pill ${getStatusClass(event.status)}`}
                >
                  {event.status || "Няма статус"}
                </div>
                <button
                  className="uevd-close-btn"
                  onClick={onClose}
                  title="Затвори"
                >
                  <X size={24} strokeWidth={2.5} />
                </button>
              </div>

              <div className="uevd-title-section">
                <h1 className="uevd-title">{event.subject}</h1>
              </div>

              <div className="uevd-location-badge uevd-flex-align">
                <div className="uevd-icon-wrapper">
                  <Building2 size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h3>{event.building?.name || "Неизвестна сграда"}</h3>
                  <small>{event.building?.address || "Няма адрес"}</small>
                </div>
              </div>
            </div>

            <div className="uevd-divider"></div>

            <div className="uevd-body">
              <div className="uevd-description-container">
                <span className="uevd-section-label uevd-flex-align">
                  <AlignLeft size={16} strokeWidth={2.5} /> Описание на задачата
                </span>
                <div className="uevd-description-content">
                  {event.description || (
                    <em className="text-muted">Няма въведено описание.</em>
                  )}
                </div>
              </div>

              <div className="uevd-meta-grid">
                <div className="uevd-meta-box">
                  <div className="uevd-meta-icon">
                    <CalendarDays size={20} strokeWidth={2.5} />
                  </div>
                  <div className="uevd-meta-info">
                    <span className="uevd-meta-label">Краен срок</span>
                    <span className="uevd-meta-value uevd-primary-text">
                      {formatDateTime(event.completion_date)}
                    </span>
                  </div>
                </div>

                <div className="uevd-meta-box">
                  <div className="uevd-meta-icon">
                    <User size={20} strokeWidth={2.5} />
                  </div>
                  <div className="uevd-meta-info">
                    <span className="uevd-meta-label">Възложено на</span>
                    <span className="uevd-meta-value">
                      {event.assigned_user
                        ? `${event.assigned_user.first_name} ${event.assigned_user.last_name}`
                        : "Не е назначено"}
                    </span>
                  </div>
                </div>

                <div className="uevd-meta-box">
                  <div className="uevd-meta-icon">
                    <Clock size={20} strokeWidth={2.5} />
                  </div>
                  <div className="uevd-meta-info">
                    <span className="uevd-meta-label">Създадено на</span>
                    <span className="uevd-meta-value">
                      {formatDateTime(event.created_at)}
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

export default UserEventDetails;
