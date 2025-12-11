import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { useTheme } from "../../components/ThemeContext";
import "./styles/UserEventDetails.css";

function UserEventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
          `
        )
        .eq("id", id)
        .single();

      if (error) {
        console.error("Supabase error:", error);
      } else {
        setEvent(data);
      }
      setLoading(false);
    }
    fetchEvent();
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
    if (s.includes("ново") || s.includes("new")) return "uevd-status-new";
    if (s.includes("изпълнено") || s.includes("done"))
      return "uevd-status-done";
    return "uevd-status-default";
  };

  if (loading)
    return (
      <div
        className={`uevd-wrapper ${
          isDarkMode ? "client-dark" : "client-light"
        }`}
      >
        <div className="uevd-loading">
          <div className="uevd-spinner"></div>
          <p>Зареждане на детайли...</p>
        </div>
      </div>
    );

  if (!event)
    return (
      <div
        className={`uevd-wrapper ${
          isDarkMode ? "client-dark" : "client-light"
        }`}
      >
        <div className="uevd-error">Събитието не е намерено.</div>
      </div>
    );

  const statusClass = getStatusClass(event.status);

  return (
    <div
      className={`uevd-wrapper ${isDarkMode ? "client-dark" : "client-light"}`}
    >
      <div className="uevd-page-header">
        <button
          className="uevd-back-link"
          onClick={() => navigate("/client/userevents")}
        >
          ← Назад към списъка
        </button>
        <div className={`uevd-status-pill ${statusClass}`}>
          {event.status || "Няма статус"}
        </div>
      </div>

      <div className="uevd-main-card fade-in">
        <div className="uevd-card-header">
          <div className="uevd-location-badge">
            <span className="icon">🏢</span>
            <div>
              <h3>{event.building?.name || "Неизвестна сграда"}</h3>
              <small>{event.building?.address || "Няма адрес"}</small>
            </div>
          </div>
          <div className="uevd-dates">
            <div className="date-item">
              <span>📅 Краен срок:</span>
              <strong>{formatDateTime(event.completion_date)}</strong>
            </div>
          </div>
        </div>

        <div className="uevd-divider"></div>

        <div className="uevd-body">
          <h1 className="uevd-title">{event.subject}</h1>

          <div className="uevd-description-container">
            <span className="uevd-section-label">Описание на задачата</span>
            <div className="uevd-description-content">
              {event.description || (
                <em className="text-muted">Няма въведено описание.</em>
              )}
            </div>
          </div>

          <div className="uevd-meta-grid">
            <div className="uevd-meta-box">
              <span className="uevd-meta-icon">👤</span>
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
              <span className="uevd-meta-icon">📝</span>
              <div className="uevd-meta-info">
                <span className="uevd-meta-label">Създадено на</span>
                <span className="uevd-meta-value">
                  {formatDateTime(event.created_at)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserEventDetails;
