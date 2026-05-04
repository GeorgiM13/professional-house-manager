import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { useTheme } from "../../components/ThemeContext";
import {
  User,
  Mail,
  Phone,
  Calendar,
  MessageSquare,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";
import "./styles/FormDetails.css";

function FormDetails({ messageId, onClose }) {
  const { isDarkMode } = useTheme();
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!messageId) return;

    async function fetchMessage() {
      setLoading(true);
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .eq("id", messageId)
        .single();

      if (error) {
        console.error("Supabase error:", error);
      } else {
        setMessage(data);
      }
      setLoading(false);
    }

    fetchMessage();
  }, [messageId]);

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

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains("adm-formdet-overlay")) {
      onClose();
    }
  };

  if (!messageId) return null;

  return (
    <div
      className={`adm-formdet-overlay ${isDarkMode ? "adm-formdet-dark" : "adm-formdet-light"}`}
      onClick={handleOverlayClick}
    >
      <div className="adm-formdet-modal adm-formdet-fade-in">
        {loading ? (
          <div className="adm-formdet-loading adm-formdet-flex-col adm-formdet-flex-center">
            <Loader2
              size={40}
              strokeWidth={2.5}
              className="adm-formdet-spinner-icon"
            />
            <p>Зареждане на съобщението...</p>
          </div>
        ) : !message ? (
          <div className="adm-formdet-error adm-formdet-flex-col adm-formdet-flex-center">
            <AlertCircle size={48} strokeWidth={2} />
            <p>Съобщението не е намерено.</p>
            <button className="adm-formdet-close-btn-error" onClick={onClose}>
              Затвори
            </button>
          </div>
        ) : (
          <>
            <div className="adm-formdet-header">
              <div className="adm-formdet-header-title">
                <h2>Детайли за съобщението</h2>
                <p>Изпратено от контактната форма</p>
              </div>
              <button
                className="adm-formdet-close-btn"
                onClick={onClose}
                title="Затвори"
              >
                <X size={24} strokeWidth={2.5} />
              </button>
            </div>

            <div className="adm-formdet-body">
              <div className="adm-formdet-meta-grid">
                <div className="adm-formdet-meta-box">
                  <div className="adm-formdet-meta-icon">
                    <User size={20} strokeWidth={2.5} />
                  </div>
                  <div className="adm-formdet-meta-info">
                    <span className="adm-formdet-meta-label">Подател</span>
                    <span className="adm-repdet-meta-value">
                      {message.first_name} {message.last_name}
                    </span>
                  </div>
                </div>

                <div className="adm-formdet-meta-box">
                  <div className="adm-formdet-meta-icon">
                    <Calendar size={20} strokeWidth={2.5} />
                  </div>
                  <div className="adm-formdet-meta-info">
                    <span className="adm-formdet-meta-label">
                      Дата на изпращане
                    </span>
                    <span className="adm-repdet-meta-value">
                      {formatDateTime(message.created_at)}
                    </span>
                  </div>
                </div>

                <div className="adm-formdet-meta-box">
                  <div className="adm-formdet-meta-icon">
                    <Mail size={20} strokeWidth={2.5} />
                  </div>
                  <div className="adm-formdet-meta-info">
                    <span className="adm-formdet-meta-label">Имейл</span>
                    <span className="adm-repdet-meta-value">
                      <a href={`mailto:${message.email}`}>{message.email}</a>
                    </span>
                  </div>
                </div>

                <div className="adm-formdet-meta-box">
                  <div className="adm-formdet-meta-icon">
                    <Phone size={20} strokeWidth={2.5} />
                  </div>
                  <div className="adm-formdet-meta-info">
                    <span className="adm-formdet-meta-label">Телефон</span>
                    <span className="adm-repdet-meta-value">
                      {message.phone ? (
                        <a href={`tel:${message.phone}`}>{message.phone}</a>
                      ) : (
                        <em className="adm-formdet-text-muted">Няма въведен</em>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="adm-formdet-message-container">
                <span className="adm-formdet-section-label adm-formdet-flex-align">
                  <MessageSquare size={16} strokeWidth={2.5} /> Съдържание на
                  съобщението
                </span>
                <div className="adm-formdet-message-content">
                  {message.message}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default FormDetails;
