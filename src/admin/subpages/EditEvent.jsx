import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Select from "react-select";
import Swal from "sweetalert2";
import DatePicker, { registerLocale } from "react-datepicker";
import bg from "date-fns/locale/bg";
import "react-datepicker/dist/react-datepicker.css";

import { supabase } from "../../supabaseClient";
import { useTheme } from "../../components/ThemeContext";
import ConfirmModal from "../../components/ConfirmModal";

import { useUserBuildings } from "../hooks/UseUserBuildings";
import { useLocalUser } from "../hooks/UseLocalUser";

import {
  FileText,
  Settings,
  Building,
  CalendarDays,
  User,
  Trash2,
  Circle,
  CheckCircle2,
} from "lucide-react";

import "./styles/EditEvent.css";

registerLocale("bg", bg);

const STATUS_OPTIONS = [
  { value: "ново", label: "Ново", color: "#3b82f6", iconName: "circle" },
  {
    value: "изпълнено",
    label: "Изпълнено",
    color: "#22c55e",
    iconName: "check-circle",
  },
];

const IconMap = {
  circle: Circle,
  "check-circle": CheckCircle2,
  building: Building,
  user: User,
};

const customFormatOptionLabel = ({ label, iconName, color }, { context }) => {
  const IconComponent = IconMap[iconName];
  const shouldShowIcon =
    IconComponent &&
    (context === "value" || (iconName !== "building" && iconName !== "user"));

  return (
    <div className="edv-select-item">
      {shouldShowIcon && (
        <IconComponent
          size={16}
          strokeWidth={2.5}
          className="edv-select-icon"
          style={{ color: color || "inherit" }}
        />
      )}
      <span>{label}</span>
    </div>
  );
};

function EditEvent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  const { user: currentUser } = useLocalUser();
  const { buildings, loading: loadingBuildings } = useUserBuildings(
    currentUser?.id,
  );

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [formData, setFormData] = useState({
    status: "",
    subject: "",
    description: "",
    completion_date: null,
    assigned_to: "",
    building_id: "",
  });

  useEffect(() => {
    async function fetchUsers() {
      const { data } = await supabase
        .from("users")
        .select("id, first_name, last_name, role")
        .or("role.eq.admin,role.eq.manager");
      setUsers(data || []);
    }
    fetchUsers();
  }, []);

  useEffect(() => {
    async function fetchEvent() {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
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
          completion_date: data.completion_date
            ? new Date(data.completion_date)
            : null,
          assigned_to: data.assigned_to || "",
          building_id: data.building_id || "",
        });
      }
      setLoading(false);
    }
    fetchEvent();
  }, [id]);

  const buildingOptions = useMemo(() => {
    return buildings.map((b) => ({
      value: b.id,
      label: `${b.name}, ${b.address}`,
      iconName: "building",
    }));
  }, [buildings]);

  const assignedOptions = useMemo(() => {
    return users.map((u) => ({
      value: u.id,
      label: `${u.first_name} ${u.last_name}`,
      iconName: "user",
    }));
  }, [users]);

  const selectStyles = {
    control: (base, state) => ({
      ...base,
      background: isDarkMode ? "#0f172a" : "#f8fafc",
      borderColor: state.isFocused
        ? "var(--au-primary)"
        : isDarkMode
          ? "#334155"
          : "#cbd5e1",
      color: isDarkMode ? "#f1f5f9" : "#1e293b",
      minHeight: "42px",
      borderRadius: "8px",
      boxShadow: state.isFocused ? "0 0 0 3px rgba(59, 130, 246, 0.1)" : "none",
    }),
    menu: (base) => ({
      ...base,
      background: isDarkMode ? "#1e293b" : "white",
      zIndex: 9999,
      border: "1px solid var(--au-border)",
    }),
    option: (base, state) => {
      if (state.isSelected)
        return {
          ...base,
          backgroundColor: "#3b82f6",
          color: "white",
          cursor: "pointer",
        };
      if (state.isFocused)
        return {
          ...base,
          backgroundColor: isDarkMode ? "#334155" : "#eff6ff",
          color: isDarkMode ? "#f1f5f9" : "#1e293b",
          cursor: "pointer",
        };
      return {
        ...base,
        backgroundColor: "transparent",
        color: isDarkMode ? "#f1f5f9" : "#1e293b",
        cursor: "pointer",
      };
    },
    singleValue: (base, state) => ({
      ...base,
      color:
        state.selectProps.value?.color || (isDarkMode ? "#f1f5f9" : "#1e293b"),
      fontWeight: state.selectProps.value?.color ? 600 : 400,
    }),
    input: (base) => ({ ...base, color: isDarkMode ? "#f1f5f9" : "#1e293b" }),
    placeholder: (base) => ({ ...base, color: "var(--au-text-sec)" }),
  };

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toLocalISOString = (date) => {
    if (!date) return null;
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, -1);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);

    const updateData = {
      status: formData.status,
      subject: formData.subject,
      description: formData.description,
      assigned_to: formData.assigned_to || null,
      building_id: formData.building_id,
      completion_date: toLocalISOString(formData.completion_date),
    };

    const { error } = await supabase
      .from("events")
      .update(updateData)
      .eq("id", id);

    if (error) {
      Swal.fire({ icon: "error", title: "Грешка", text: error.message });
      setSaving(false);
    } else {
      await Swal.fire({
        icon: "success",
        title: "Запазено!",
        text: "Събитието е обновено успешно.",
        timer: 1500,
        showConfirmButton: false,
      });
      navigate("/admin/adminevents");
    }
  };

  const handleDeleteConfirmed = async () => {
    setSaving(true);
    const { error } = await supabase.from("events").delete().eq("id", id);

    if (error) {
      Swal.fire({ icon: "error", title: "Грешка", text: error.message });
      setSaving(false);
    } else {
      await Swal.fire({
        icon: "success",
        title: "Изтрит!",
        text: "Събитието е премахнато.",
        timer: 1500,
        showConfirmButton: false,
      });
      navigate("/admin/adminevents");
    }
    setShowConfirm(false);
  };

  const goBack = () => navigate("/admin/adminevents");

  if (loading)
    return (
      <div className={`edv-container ${isDarkMode ? "au-dark" : "au-light"}`}>
        <div style={{ textAlign: "center", padding: "4rem" }}>Зареждане...</div>
      </div>
    );

  return (
    <div className={`edv-container ${isDarkMode ? "au-dark" : "au-light"}`}>
      <div className="edv-header">
        <div>
          <h1>Редакция на събитие</h1>
          <p>Промяна на параметри и статус</p>
        </div>
        <button className="edv-btn edv-btn-secondary" onClick={goBack}>
          Назад
        </button>
      </div>

      <div className="edv-grid">
        <div className="edv-card">
          <div className="edv-section-title">
            <FileText
              size={20}
              strokeWidth={2.5}
              className="edv-section-icon"
            />
            Описание на задачата
          </div>

          <div className="edv-form-group">
            <label>Относно</label>
            <input
              className="edv-input"
              value={formData.subject}
              onChange={(e) => handleChange("subject", e.target.value)}
            />
          </div>

          <div className="edv-form-group">
            <label>Описание</label>
            <textarea
              className="edv-textarea"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
            />
          </div>
        </div>

        <div className="edv-card" style={{ height: "fit-content" }}>
          <div className="edv-section-title">
            <Settings
              size={20}
              strokeWidth={2.5}
              className="edv-section-icon"
            />
            Детайли
          </div>

          <div className="edv-form-group">
            <label>Сграда</label>
            <Select
              options={buildingOptions}
              isLoading={loadingBuildings}
              value={buildingOptions.find(
                (op) => op.value === formData.building_id,
              )}
              onChange={(opt) => handleChange("building_id", opt?.value)}
              placeholder={
                <div className="edv-select-item">
                  <Building
                    size={16}
                    strokeWidth={2.5}
                    className="edv-select-icon"
                  />
                  <span>Избери сграда...</span>
                </div>
              }
              styles={selectStyles}
              noOptionsMessage={() => "Няма намерени"}
              formatOptionLabel={customFormatOptionLabel}
            />
          </div>

          <div className="edv-form-group" style={{ marginTop: "1rem" }}>
            <label>Статус</label>
            <Select
              options={STATUS_OPTIONS}
              value={STATUS_OPTIONS.find((s) => s.value === formData.status)}
              onChange={(opt) => handleChange("status", opt?.value)}
              styles={selectStyles}
              isSearchable={false}
              formatOptionLabel={customFormatOptionLabel}
            />
          </div>

          <div className="edv-form-group" style={{ marginTop: "1rem" }}>
            <label>Дата и час на изпълнение</label>
            <div className="custom-datepicker-wrapper">
              <span className="calendar-icon">
                <CalendarDays size={18} strokeWidth={2.5} />
              </span>
              <DatePicker
                selected={formData.completion_date}
                onChange={(date) => handleChange("completion_date", date)}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                timeCaption="Час"
                dateFormat="dd MMMM yyyy, HH:mm"
                placeholderText="Изберете дата..."
                className="edv-input date-input-field"
                locale="bg"
                autoComplete="off"
                isClearable
              />
            </div>
          </div>

          <div className="edv-form-group" style={{ marginTop: "1rem" }}>
            <label>Възложено на</label>
            <Select
              options={assignedOptions}
              value={assignedOptions.find(
                (u) => u.value === formData.assigned_to,
              )}
              onChange={(opt) => handleChange("assigned_to", opt?.value)}
              placeholder={
                <div className="edv-select-item">
                  <User
                    size={16}
                    strokeWidth={2.5}
                    className="edv-select-icon"
                  />
                  <span>Избери служител...</span>
                </div>
              }
              styles={selectStyles}
              isSearchable={false}
              formatOptionLabel={customFormatOptionLabel}
            />
          </div>
        </div>

        <div className="edv-actions">
          <button
            type="button"
            className="edv-btn edv-btn-danger"
            onClick={() => setShowConfirm(true)}
            disabled={saving}
            style={{
              marginRight: "auto",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Trash2 size={18} strokeWidth={2.5} /> Изтрий
          </button>
          <button
            className="edv-btn edv-btn-secondary"
            onClick={goBack}
            disabled={saving}
          >
            Отказ
          </button>
          <button
            className="edv-btn edv-btn-primary"
            onClick={handleUpdate}
            disabled={saving}
          >
            {saving ? "Запазване..." : "Запази промените"}
          </button>
        </div>
      </div>

      {showConfirm && (
        <ConfirmModal
          title="Изтриване на събитие"
          message="Сигурни ли сте, че искате да премахнете това събитие?"
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}

export default EditEvent;
