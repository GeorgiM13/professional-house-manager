import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Select from "react-select";
import Swal from "sweetalert2";
import { supabase } from "../../supabaseClient";
import ConfirmModal from "../../components/ConfirmModal";
import { useTheme } from "../../components/ThemeContext";
import "./styles/EditReport.css";

const STATUS_OPTIONS = [
  { value: "ново", label: "🔵 Ново (Чака преглед)", color: "#3b82f6" },
  { value: "работи се", label: "🟡 Работи се", color: "#eab308" },
  { value: "изпълнено", label: "🟢 Изпълнено", color: "#22c55e" },
  { value: "отхвърлено", label: "🔴 Отхвърлено", color: "#ef4444" },
];

function EditReport() {
  const { id } = useParams();
  const navigate = useNavigate();
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
    async function fetchReport() {
      const { data, error } = await supabase
        .from("reports")
        .select(`*, building:building_id(name,address)`)
        .eq("id", id)
        .single();

      if (error) {
        console.error("Supabase error:", error);
        Swal.fire({ icon: "error", title: "Грешка", text: "Неуспешно зареждане." });
      } else if (data) {
        setFormData({
          status: data.status || "ново",
          subject: data.subject || "",
          description: data.description || "",
          notes: data.notes || "",
          building_name: data.building ? `${data.building.name}, ${data.building.address}` : "Неизвестна сграда",
        });
      }
      setLoading(false);
    }
    fetchReport();
  }, [id]);

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
      notes: formData.notes
    };

    const { error } = await supabase
      .from("reports")
      .update(updateData)
      .eq("id", Number(id));

    if (error) {
      Swal.fire({ icon: "error", title: "Грешка", text: error.message });
      setSaving(false);
    } else {
      await Swal.fire({
          icon: "success",
          title: "Запазено!",
          text: "Сигналът е обновен успешно.",
          timer: 1500,
          showConfirmButton: false
      });
      navigate("/admin/reports");
    }
  };

  const handleDeleteConfirmed = async () => {
    const { error } = await supabase.from("reports").delete().eq("id", id);

    if (error) {
        Swal.fire({ icon: "error", title: "Грешка", text: error.message });
    } else {
        await Swal.fire({
            icon: "success",
            title: "Изтрит!",
            text: "Сигналът е премахнат.",
            timer: 1500,
            showConfirmButton: false
        });
        navigate("/admin/reports");
    }
    setShowConfirm(false);
  };

  const goBack = () => navigate("/admin/reports");

  const selectStyles = {
    control: (base, state) => ({
      ...base,
      background: isDarkMode ? "#0f172a" : "#f8fafc",
      borderColor: state.isFocused ? "#3b82f6" : (isDarkMode ? "#334155" : "#cbd5e1"),
      color: isDarkMode ? "#f1f5f9" : "#1e293b",
      minHeight: "42px",
      borderRadius: "8px",
      boxShadow: state.isFocused ? "0 0 0 3px rgba(59, 130, 246, 0.1)" : "none",
    }),
    menu: (base) => ({
      ...base,
      background: isDarkMode ? "#1e293b" : "white",
      zIndex: 9999,
      border: isDarkMode ? "1px solid #334155" : "1px solid #e2e8f0",
    }),
    option: (base, state) => {
        if (state.isSelected) return { ...base, backgroundColor: "#3b82f6", color: "white", cursor: "pointer" };
        if (state.isFocused) return { ...base, backgroundColor: isDarkMode ? "#334155" : "#eff6ff", color: isDarkMode ? "#f1f5f9" : "#1e293b", cursor: "pointer" };
        return { ...base, backgroundColor: "transparent", color: isDarkMode ? "#f1f5f9" : "#1e293b", cursor: "pointer" };
    },
    singleValue: (base, state) => ({
      ...base,
      color: state.selectProps.value?.color || (isDarkMode ? "#f1f5f9" : "#1e293b"),
      fontWeight: 600
    }),
    input: (base) => ({ ...base, color: isDarkMode ? "#f1f5f9" : "#1e293b" }),
    placeholder: (base) => ({ ...base, color: "var(--au-text-sec)" }),
  };

  if (loading) return (
      <div className={`edr-container ${isDarkMode ? "au-dark" : "au-light"}`}>
          <div style={{textAlign: "center", padding: "4rem"}}>Зареждане...</div>
      </div>
  );

  return (
    <div className={`edr-container ${isDarkMode ? "au-dark" : "au-light"}`}>
      <div className="edr-header">
        <div>
          <h1>Редакция на сигнал</h1>
          <p>Обработка и статус на сигнала</p>
        </div>
        <button className="edr-btn edr-btn-secondary" onClick={goBack}>
          Назад
        </button>
      </div>

      <div className="edr-grid">
        <div className="edr-card">
            <div className="edr-section-title">📝 Детайли за сигнала</div>
            
            <div className="edr-form-group">
                <label>Относно</label>
                <input
                    name="subject"
                    className="edr-input"
                    type="text"
                    value={formData.subject}
                    onChange={handleChange}
                />
            </div>

            <div className="edr-form-group">
                <label>Описание</label>
                <textarea
                    name="description"
                    className="edr-textarea"
                    value={formData.description}
                    onChange={handleChange}
                />
            </div>

            <div className="edr-form-group">
                <label style={{color: "#d97706"}}>🔒 Административни бележки</label>
                <textarea
                    name="notes"
                    className="edr-textarea"
                    style={{minHeight: "100px"}}
                    value={formData.notes}
                    onChange={handleChange}
                />
            </div>
        </div>

        <div className="edr-card" style={{height: "fit-content"}}>
            <div className="edr-section-title">⚙️ Статус</div>

            <div className="edr-form-group">
                <label>Сграда</label>
                <div style={{padding: "0.5rem 0", fontSize: "0.95rem", fontWeight: "600"}}>
                    {formData.building_name}
                </div>
            </div>

            <hr style={{margin: "0.5rem 0", border: "0", borderTop: "1px dashed var(--au-border)"}} />

            <div className="edr-form-group">
                <label>Състояние</label>
                <Select
                    options={STATUS_OPTIONS}
                    value={STATUS_OPTIONS.find(s => s.value === formData.status)}
                    onChange={handleStatusChange}
                    styles={selectStyles}
                    isSearchable={false}
                />
            </div>
        </div>

        <div className="edr-actions">
            <button
                type="button"
                className="edr-btn edr-btn-danger"
                onClick={() => setShowConfirm(true)}
                disabled={saving}
                style={{marginRight: "auto"}}
            >
                🗑️ Изтрий
            </button>
            <button
                type="button"
                className="edr-btn edr-btn-secondary"
                onClick={goBack}
                disabled={saving}
            >
                Отказ
            </button>
            <button
                type="button"
                className="edr-btn edr-btn-primary"
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
  );
}

export default EditReport;