import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { useTheme } from "../../components/ThemeContext";
import { Building, CalendarDays, User, CalendarPlus } from "lucide-react";
import "./styles/EventDetails.css";

function EventDetails() {
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
          `,
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
    if (s.includes("ново") || s.includes("new")) return "status-new";
    if (s.includes("изпълнено") || s.includes("done")) return "status-done";
    return "status-default";
  };

  if (loading)
    return (
      <div className={`evd-wrapper ${isDarkMode ? "au-dark" : "au-light"}`}>
        <div className="evd-loading">
          <div className="spinner"></div>
          <p>Зареждане на детайли...</p>
        </div>
      </div>
    );

  if (!event)
    return (
      <div className={`evd-wrapper ${isDarkMode ? "au-dark" : "au-light"}`}>
        <div className="evd-error">Събитието не е намерено.</div>
      </div>
    );

  const statusClass = getStatusClass(event.status);

  return (
    <div className={`evd-wrapper ${isDarkMode ? "au-dark" : "au-light"}`}>
      <div className="evd-page-header">
        <button
          className="evd-back-link"
          onClick={() => navigate("/admin/adminevents")}
        >
          ← Назад към списъка
        </button>
        <div className={`evd-status-pill ${statusClass}`}>
          {event.status || "Няма статус"}
        </div>
      </div>

      <div className="evd-main-card fade-in">
        <div className="evd-card-header">
          <div className="evd-location-badge">
            <span className="icon">
              <Building size={28} strokeWidth={2.5} />
            </span>
            <div>
              <h3>{event.building?.name || "Неизвестна сграда"}</h3>
              <small>{event.building?.address || "Няма адрес"}</small>
            </div>
          </div>
          <div className="evd-dates">
            <div className="date-item">
              <span className="evd-date-label">
                <CalendarDays size={16} strokeWidth={2.5} /> Краен срок:
              </span>
              <strong>{formatDateTime(event.completion_date)}</strong>
            </div>
          </div>
        </div>

        <div className="evd-divider"></div>

        <div className="evd-body">
          <h1 className="evd-title">{event.subject}</h1>

          <div className="evd-description-container">
            <span className="evd-section-label">Описание на задачата</span>
            <div className="evd-description-content">
              {event.description || (
                <em className="text-muted">Няма въведено описание.</em>
              )}
            </div>
          </div>

          <div className="evd-meta-grid">
            <div className="meta-box">
              <span className="meta-icon">
                <User size={24} strokeWidth={2.5} />
              </span>
              <div className="meta-info">
                <span className="meta-label">Възложено на</span>
                <span className="meta-value">
                  {event.assigned_user
                    ? `${event.assigned_user.first_name} ${event.assigned_user.last_name}`
                    : "Не е назначено"}
                </span>
              </div>
            </div>

            <div className="meta-box">
              <span className="meta-icon">
                <CalendarPlus size={24} strokeWidth={2.5} />
              </span>
              <div className="meta-info">
                <span className="meta-label">Създадено на</span>
                <span className="meta-value">
                  {formatDateTime(event.created_at)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="evd-footer">
          <button
            className="evd-btn evd-btn-primary"
            onClick={() => navigate(`/admin/editevent/${event.id}`)}
          >
            Редактирай събитието
          </button>
        </div>
      </div>
    </div>
  );
}

export default EventDetails;
