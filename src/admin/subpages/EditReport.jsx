import { useState, useEffect } from "react";
import Select from "react-select";
import Swal from "sweetalert2";
import { supabase } from "../../supabaseClient";
import ConfirmModal from "../../components/ConfirmModal";
import { useTheme } from "../../components/ThemeContext";
import {
  CircleDashed,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Lock,
  Settings,
  Trash2,
  X,
} from "lucide-react";
import "./styles/EditReport.css";

const STATUS_OPTIONS = [
  {
    value: "ново",
    label: "Ново (Чака преглед)",
    color: "#3b82f6",
    icon: CircleDashed,
  },
  { value: "работи се", label: "Работи се", color: "#eab308", icon: Clock },
  {
    value: "изпълнено",
    label: "Изпълнено",
    color: "#22c55e",
    icon: CheckCircle2,
  },
  { value: "отхвърлено", label: "Отхвърлено", color: "#ef4444", icon: XCircle },
];

function EditReport({ reportId, onClose, onSuccess }) {
  const { isDarkMode } = useTheme();

  const [formData, setFormData] = useState({
    status: "",
    subject: "",
    description: "",
    notes: "",
    building_name: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!reportId) return;

    async function fetchReport() {
      const { data, error } = await supabase
        .from("reports")
        .select(`*, building:building_id(name,address)`)
        .eq("id", reportId)
        .single();

      if (error) {
        console.error("Supabase error:", error);
        Swal.fire({
          icon: "error",
          title: "Грешка",
          text: "Неуспешно зареждане.",
        });
      } else if (data) {
        setFormData({
          status: data.status || "ново",
          subject: data.subject || "",
          description: data.description || "",
          notes: data.notes || "",
          building_name: data.building
            ? `${data.building.name}, ${data.building.address}`
            : "Неизвестна сграда",
        });
      }
      setLoading(false);
    }
    fetchReport();
  }, [reportId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleStatusChange = (option) => {
    setFormData({ ...formData, status: option.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const updateData = {
      status: formData.status,
      subject: formData.subject,
      description: formData.description,
      notes: formData.notes,
    };

    const { error } = await supabase
      .from("reports")
      .update(updateData)
      .eq("id", Number(reportId));

    if (error) {
      Swal.fire({ icon: "error", title: "Грешка", text: error.message });
      setSaving(false);
    } else {
      await Swal.fire({
        icon: "success",
        title: "Запазено!",
        text: "Сигналът е обновен успешно.",
        timer: 1500,
        showConfirmButton: false,
      });
      if (onSuccess) onSuccess();
    }
  };

  const handleDeleteConfirmed = async () => {
    const { error } = await supabase
      .from("reports")
      .delete()
      .eq("id", reportId);

    if (error) {
      Swal.fire({ icon: "error", title: "Грешка", text: error.message });
    } else {
      await Swal.fire({
        icon: "success",
        title: "Изтрит!",
        text: "Сигналът е премахнат.",
        timer: 1500,
        showConfirmButton: false,
      });
      if (onSuccess) onSuccess();
    }
    setShowConfirm(false);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const selectStyles = {
    menuPortal: (base) => ({ ...base, zIndex: 1050 }),
    control: (base, state) => ({
      ...base,
      background: isDarkMode ? "#0f172a" : "#f8fafc",
      borderColor: state.isFocused
        ? "#3b82f6"
        : isDarkMode
          ? "#334155"
          : "#cbd5e1",
      color: isDarkMode ? "#f1f5f9" : "#1e293b",
      minHeight: "42px",
      borderRadius: "8px",
      boxShadow: state.isFocused ? "0 0 0 3px rgba(59, 130, 246, 0.1)" : "none",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }),
    menu: (base) => ({
      ...base,
      background: isDarkMode ? "#1e293b" : "white",
      zIndex: 9999,
      border: isDarkMode ? "1px solid #334155" : "1px solid #e2e8f0",
    }),
    option: (base, state) => {
      let bgColor = "transparent";
      let color = isDarkMode ? "#f1f5f9" : "#1e293b";

      if (state.isSelected) {
        bgColor = "#3b82f6";
        color = "white";
      } else if (state.isFocused) {
        bgColor = isDarkMode ? "#334155" : "#eff6ff";
      }

      return {
        ...base,
        backgroundColor: bgColor,
        color: color,
        cursor: "pointer",
        fontFamily: "system-ui, -apple-system, sans-serif",
      };
    },
    singleValue: (base, state) => ({
      ...base,
      color:
        state.selectProps.value?.color || (isDarkMode ? "#f1f5f9" : "#1e293b"),
      fontWeight: 600,
      fontFamily: "system-ui, -apple-system, sans-serif",
    }),
    input: (base) => ({
      ...base,
      color: isDarkMode ? "#f1f5f9" : "#1e293b",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }),
    placeholder: (base) => ({
      ...base,
      color: "var(--adm-editrep-text-sec)",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }),
  };

  const formatOptionLabel = ({ label, icon: Icon, color }) => (
    <div className="adm-editrep-select-option">
      {Icon && <Icon size={18} strokeWidth={2.5} color={color} />}
      <span>{label}</span>
    </div>
  );

  if (loading) {
    return (
      <div
        className={`adm-editrep-overlay ${isDarkMode ? "adm-editrep-dark" : "adm-editrep-light"}`}
        onClick={handleOverlayClick}
      >
        <div className="adm-editrep-loading-box">
          <div className="adm-editrep-spinner"></div>
          <p>Зареждане...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`adm-editrep-overlay ${isDarkMode ? "adm-editrep-dark" : "adm-editrep-light"}`}
      onClick={handleOverlayClick}
    >
      <div className="adm-editrep-modal adm-editrep-fade-in">
        <div className="adm-editrep-header">
          <div>
            <h1>Редакция на сигнал</h1>
            <p>Обработка и статус на сигнала</p>
          </div>
          <button className="adm-editrep-close-btn" onClick={onClose}>
            <X size={24} strokeWidth={2.5} />
          </button>
        </div>

        <div className="adm-editrep-grid">
          <div className="adm-editrep-card">
            <div className="adm-editrep-section-title">
              <FileText
                className="adm-editrep-section-icon"
                size={20}
                strokeWidth={2.5}
              />
              Детайли за сигнала
            </div>

            <div className="adm-editrep-form-group">
              <label>Относно</label>
              <input
                name="subject"
                className="adm-editrep-input"
                type="text"
                value={formData.subject}
                onChange={handleChange}
              />
            </div>

            <div className="adm-editrep-form-group">
              <label>Описание</label>
              <textarea
                name="description"
                className="adm-editrep-textarea"
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            <div className="adm-editrep-form-group">
              <label className="adm-editrep-admin-label">
                <Lock size={16} strokeWidth={2.5} />
                Административни бележки
              </label>
              <textarea
                name="notes"
                className="adm-editrep-textarea adm-editrep-notes-textarea"
                value={formData.notes}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="adm-editrep-card adm-editrep-card-fit">
            <div className="adm-editrep-section-title">
              <Settings
                className="adm-editrep-section-icon"
                size={20}
                strokeWidth={2.5}
              />
              Статус
            </div>

            <div className="adm-editrep-form-group">
              <label>Сграда</label>
              <div className="adm-editrep-building-name">
                {formData.building_name}
              </div>
            </div>

            <hr className="adm-editrep-divider" />

            <div className="adm-editrep-form-group">
              <label>Състояние</label>
              <Select
                options={STATUS_OPTIONS}
                value={STATUS_OPTIONS.find((s) => s.value === formData.status)}
                onChange={handleStatusChange}
                styles={selectStyles}
                formatOptionLabel={formatOptionLabel}
                isSearchable={false}
                menuPortalTarget={document.body}
              />
            </div>
          </div>

          <div className="adm-editrep-actions">
            <button
              type="button"
              className="adm-editrep-btn adm-editrep-btn-danger adm-editrep-btn-left"
              onClick={() => setShowConfirm(true)}
              disabled={saving}
            >
              <Trash2 size={18} strokeWidth={2.5} />
              Изтрий
            </button>
            <button
              type="button"
              className="adm-editrep-btn adm-editrep-btn-secondary"
              onClick={onClose}
              disabled={saving}
            >
              Отказ
            </button>
            <button
              type="button"
              className="adm-editrep-btn adm-editrep-btn-primary"
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? "Запазване..." : "Запази промените"}
            </button>
          </div>
        </div>

        {showConfirm && (
          <ConfirmModal
            title="Изтриване на сигнал"
            message="Наистина ли искате да изтриете този сигнал?"
            onConfirm={handleDeleteConfirmed}
            onCancel={() => setShowConfirm(false)}
          />
        )}
      </div>
    </div>
  );
}

export default EditReport;
