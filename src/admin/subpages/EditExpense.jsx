import { useState, useEffect, useMemo } from "react";
import Select from "react-select";
import Swal from "sweetalert2";
import { supabase } from "../../supabaseClient";
import ConfirmModal from "../../components/ConfirmModal";
import { useTheme } from "../../components/ThemeContext";
import { useUserBuildings } from "../hooks/UseUserBuildings";
import { useLocalUser } from "../hooks/UseLocalUser";

import {
  Zap,
  ArrowUpDown,
  Lightbulb,
  Sparkles,
  Wrench,
  UserCog,
  Droplet,
  Package,
  ClipboardCheck,
  Wifi,
  KeyRound,
  Bug,
  XCircle,
  CheckCircle2,
  FileText,
  CalendarDays,
  Building,
  Trash2,
  X,
} from "lucide-react";

import "./styles/EditExpense.css";

const MONTH_NAMES = {
  1: "Януари",
  2: "Февруари",
  3: "Март",
  4: "Април",
  5: "Май",
  6: "Юни",
  7: "Юли",
  8: "Август",
  9: "Септември",
  10: "Октомври",
  11: "Ноември",
  12: "Декември",
};

const EXPENSE_TYPES = [
  { value: "electricity_lift", label: "Ток асансьор", iconName: "zap" },
  { value: "fee_lift", label: "Сервиз асансьор", iconName: "arrow-up-down" },
  {
    value: "electricity_light",
    label: "Ток осветление",
    iconName: "lightbulb",
  },
  { value: "cleaner", label: "Хигиенист", iconName: "sparkles" },
  { value: "repair", label: "Ремонт", iconName: "wrench" },
  { value: "manager", label: "Домоуправител", iconName: "user-cog" },
  { value: "water_building", label: "Вода обща", iconName: "droplet" },
  {
    value: "lighting",
    label: "Осветление (консумативи)",
    iconName: "lightbulb",
  },
  {
    value: "cleaning_supplies",
    label: "Материали почистване",
    iconName: "package",
  },
  {
    value: "fee_annual_review",
    label: "Годишен преглед асансьор",
    iconName: "clipboard-check",
  },
  { value: "internet_video", label: "Интернет / Видео", iconName: "wifi" },
  { value: "access_control", label: "Контрол достъп", iconName: "key-round" },
  { value: "pest_control", label: "Дезинсекция", iconName: "bug" },
  { value: "other", label: "Други", iconName: "package" },
];

const PAID_OPTIONS = [
  { value: "не", label: "Неплатено", color: "#ef4444", iconName: "x-circle" },
  { value: "да", label: "Платено", color: "#10b981", iconName: "check-circle" },
];

const IconMap = {
  zap: Zap,
  "arrow-up-down": ArrowUpDown,
  lightbulb: Lightbulb,
  sparkles: Sparkles,
  wrench: Wrench,
  "user-cog": UserCog,
  droplet: Droplet,
  package: Package,
  "clipboard-check": ClipboardCheck,
  wifi: Wifi,
  "key-round": KeyRound,
  bug: Bug,
  "x-circle": XCircle,
  "check-circle": CheckCircle2,
  calendar: CalendarDays,
  building: Building,
};

const customFormatOptionLabel = ({ label, iconName, color }, { context }) => {
  const IconComponent = IconMap[iconName];
  const shouldShowIcon =
    IconComponent &&
    (context === "value" ||
      (iconName !== "calendar" && iconName !== "building"));

  return (
    <div className="adm-editexp-select-item">
      {shouldShowIcon && (
        <IconComponent
          size={16}
          strokeWidth={2.5}
          className="adm-editexp-select-icon"
          style={{ color: color || "inherit" }}
        />
      )}
      <span>{label}</span>
    </div>
  );
};

function EditExpense({ expenseId, onClose, onSuccess }) {
  const { isDarkMode } = useTheme();

  const { user: currentUser } = useLocalUser();
  const { buildings, loading: loadingBuildings } = useUserBuildings(
    currentUser?.id,
  );

  const [formData, setFormData] = useState({
    type: "",
    month: "",
    year: new Date().getFullYear(),
    current_month: "",
    paid: "не",
    building_id: "",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errors, setErrors] = useState({});
  const [showConfirm, setShowConfirm] = useState(false);

  const currentYear = new Date().getFullYear();
  const yearOptions = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => currentYear + 1 - i).map((y) => ({
        value: y,
        label: `${y}`,
        iconName: "calendar",
      })),
    [currentYear],
  );

  const monthOptions = useMemo(
    () =>
      Object.entries(MONTH_NAMES).map(([k, v]) => ({
        value: parseInt(k),
        label: v,
        iconName: "calendar",
      })),
    [],
  );

  const buildingOptions = useMemo(() => {
    return buildings.map((b) => ({
      value: b.id,
      label: `${b.name}, ${b.address}`,
      iconName: "building",
    }));
  }, [buildings]);

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
      fontWeight: state.selectProps.value?.color ? 600 : 400,
      fontFamily: "system-ui, -apple-system, sans-serif",
    }),
    input: (base) => ({
      ...base,
      color: isDarkMode ? "#f1f5f9" : "#1e293b",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }),
    placeholder: (base) => ({
      ...base,
      color: "var(--adm-editexp-text-sec)",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }),
  };

  useEffect(() => {
    if (!expenseId) return;

    async function fetchExpense() {
      try {
        const { data: expense, error } = await supabase
          .from("expenses")
          .select("*")
          .eq("id", expenseId)
          .single();
        if (error) throw error;

        setFormData({
          type: expense.type,
          month: expense.month,
          year: expense.year,
          current_month: expense.current_month,
          paid: expense.paid,
          building_id: expense.building_id,
          notes: expense.notes || "",
        });
      } catch (err) {
        console.error(err);
        Swal.fire({
          icon: "error",
          title: "Грешка",
          text: "Неуспешно зареждане на разхода.",
        });
      } finally {
        setFetching(false);
      }
    }
    fetchExpense();
  }, [expenseId]);

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.type) newErrors.type = "Изберете вид разход";
    if (!formData.month) newErrors.month = "Изберете месец";
    if (!formData.building_id) newErrors.building_id = "Изберете сграда";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("expenses")
        .update({
          type: formData.type,
          month: parseInt(formData.month),
          year: parseInt(formData.year),
          current_month: parseFloat(formData.current_month) || 0,
          paid: formData.paid,
          building_id: parseInt(formData.building_id),
          notes: formData.notes,
        })
        .eq("id", expenseId);

      if (error) throw error;

      await Swal.fire({
        icon: "success",
        title: "Запазено!",
        text: "Промените са отразени успешно.",
        timer: 1500,
        showConfirmButton: false,
      });
      if (onSuccess) onSuccess();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Грешка", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirmed = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", expenseId);
      if (error) throw error;
      await Swal.fire({
        icon: "success",
        title: "Изтрит!",
        text: "Разходът е премахнат успешно.",
        timer: 1500,
        showConfirmButton: false,
      });
      if (onSuccess) onSuccess();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Грешка", text: err.message });
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains("adm-editexp-overlay")) {
      onClose();
    }
  };

  if (fetching) {
    return (
      <div
        className={`adm-editexp-overlay ${isDarkMode ? "adm-editexp-dark" : "adm-editexp-light"}`}
        onClick={handleOverlayClick}
      >
        <div className="adm-editexp-loading-box">Зареждане на данните...</div>
      </div>
    );
  }

  return (
    <div
      className={`adm-editexp-overlay ${isDarkMode ? "adm-editexp-dark" : "adm-editexp-light"}`}
      onClick={handleOverlayClick}
    >
      <div className="adm-editexp-modal adm-editexp-fade-in">
        <div className="adm-editexp-header">
          <div>
            <h1>Редакция на разход</h1>
            <p>Промяна на детайли и статус</p>
          </div>
          <button
            className="adm-editexp-close-btn"
            onClick={onClose}
            title="Затвори"
          >
            <X size={24} strokeWidth={2.5} />
          </button>
        </div>

        <div className="adm-editexp-grid">
          <div className="adm-editexp-card">
            <div className="adm-editexp-section-title">
              <FileText
                size={20}
                strokeWidth={2.5}
                className="adm-editexp-section-icon"
              />
              Основна информация
            </div>

            <div className="adm-editexp-form-group">
              <label>Вид разход *</label>
              <Select
                options={EXPENSE_TYPES}
                value={EXPENSE_TYPES.find((t) => t.value === formData.type)}
                onChange={(opt) => handleChange("type", opt?.value)}
                placeholder={
                  <div className="adm-editexp-select-item">
                    <FileText
                      size={16}
                      strokeWidth={2.5}
                      className="adm-editexp-select-icon"
                    />
                    <span>Избери вид...</span>
                  </div>
                }
                styles={selectStyles}
                isSearchable={false}
                formatOptionLabel={customFormatOptionLabel}
                menuPortalTarget={document.body}
              />
              {errors.type && (
                <span className="adm-editexp-error-msg">{errors.type}</span>
              )}
            </div>

            <div className="adm-editexp-form-group">
              <label>Сума (€)</label>
              <input
                type="number"
                step="0.01"
                className="adm-editexp-input"
                value={formData.current_month}
                onChange={(e) => handleChange("current_month", e.target.value)}
              />
            </div>

            <div className="adm-editexp-form-group">
              <label>Бележки</label>
              <textarea
                className="adm-editexp-textarea"
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Допълнителна информация..."
              />
            </div>
          </div>

          <div className="adm-editexp-card adm-editexp-card-fit">
            <div className="adm-editexp-section-title">
              <CalendarDays
                size={20}
                strokeWidth={2.5}
                className="adm-editexp-section-icon"
              />
              Контекст
            </div>

            <div className="adm-editexp-form-group">
              <label>Сграда *</label>
              <Select
                options={buildingOptions}
                isLoading={loadingBuildings}
                value={buildingOptions.find(
                  (op) => op.value === formData.building_id,
                )}
                onChange={(opt) => handleChange("building_id", opt?.value)}
                placeholder={
                  <div className="adm-editexp-select-item">
                    <Building
                      size={16}
                      strokeWidth={2.5}
                      className="adm-editexp-select-icon"
                    />
                    <span>Избери сграда...</span>
                  </div>
                }
                styles={selectStyles}
                noOptionsMessage={() => "Няма намерени"}
                formatOptionLabel={customFormatOptionLabel}
                menuPortalTarget={document.body}
              />
              {errors.building_id && (
                <span className="adm-editexp-error-msg">
                  {errors.building_id}
                </span>
              )}
            </div>

            <div className="adm-editexp-dates-grid">
              <div className="adm-editexp-form-group">
                <label>Месец *</label>
                <Select
                  options={monthOptions}
                  value={monthOptions.find((m) => m.value === formData.month)}
                  onChange={(opt) => handleChange("month", opt?.value)}
                  styles={selectStyles}
                  isSearchable={false}
                  placeholder={
                    <div className="adm-editexp-select-item">
                      <CalendarDays
                        size={16}
                        strokeWidth={2.5}
                        className="adm-editexp-select-icon"
                      />
                      <span>--</span>
                    </div>
                  }
                  menuPlacement="auto"
                  formatOptionLabel={customFormatOptionLabel}
                  menuPortalTarget={document.body}
                />
                {errors.month && (
                  <span className="adm-editexp-error-msg">{errors.month}</span>
                )}
              </div>

              <div className="adm-editexp-form-group">
                <label>Година</label>
                <Select
                  options={yearOptions}
                  value={yearOptions.find((y) => y.value === formData.year)}
                  onChange={(opt) => handleChange("year", opt?.value)}
                  styles={selectStyles}
                  isSearchable={false}
                  menuPlacement="auto"
                  formatOptionLabel={customFormatOptionLabel}
                  menuPortalTarget={document.body}
                />
              </div>
            </div>

            <hr className="adm-editexp-divider" />

            <div className="adm-editexp-form-group">
              <label>Статус на плащане</label>
              <Select
                options={PAID_OPTIONS}
                value={PAID_OPTIONS.find((p) => p.value === formData.paid)}
                onChange={(opt) => handleChange("paid", opt?.value)}
                styles={selectStyles}
                isSearchable={false}
                formatOptionLabel={customFormatOptionLabel}
                menuPortalTarget={document.body}
              />
            </div>
          </div>
        </div>

        <div className="adm-editexp-actions">
          <button
            type="button"
            className="adm-editexp-btn adm-editexp-btn-danger adm-editexp-btn-left"
            onClick={() => setShowConfirm(true)}
            disabled={loading}
          >
            <Trash2 size={18} strokeWidth={2.5} /> Изтрий
          </button>
          <button
            type="button"
            className="adm-editexp-btn adm-editexp-btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Отказ
          </button>
          <button
            type="button"
            className="adm-editexp-btn adm-editexp-btn-primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Запазване..." : "Запази промените"}
          </button>
        </div>

        {showConfirm && (
          <ConfirmModal
            title="Изтриване на разход"
            message="Сигурни ли сте, че искате да премахнете този запис?"
            onConfirm={handleDeleteConfirmed}
            onCancel={() => setShowConfirm(false)}
          />
        )}
      </div>
    </div>
  );
}

export default EditExpense;
