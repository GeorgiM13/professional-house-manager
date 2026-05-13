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
  Layers,
  LayoutGrid,
} from "lucide-react";

import "./styles/EditExpense.css";

const SPECIAL_BUILDING_ID = 7;

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
  {
    value: "electricity_ventilation",
    label: "Ток вентилация",
    iconName: "zap",
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
  {
    value: "rounding_correction",
    label: "Корекция от закръгляне",
    iconName: "package",
  },
  { value: "other", label: "Други", iconName: "package" },
];

const CATEGORY_OPTIONS = [
  { value: "common", label: "Общи", Icon: Layers },
  { value: "apartments", label: "Апартаменти", Icon: Building },
  { value: "offices", label: "Офиси", Icon: UserCog },
  { value: "garages", label: "Гаражи", Icon: Package },
  { value: "retails", label: "Ритейл", Icon: LayoutGrid },
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
    cost_category: "common",
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [errors, setErrors] = useState({});
  const [showConfirm, setShowConfirm] = useState(false);

  const isSpecialBuilding =
    Number(formData.building_id) === SPECIAL_BUILDING_ID;

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
  const buildingOptions = useMemo(
    () =>
      buildings.map((b) => ({
        value: b.id,
        label: `${b.name}, ${b.address}`,
        iconName: "building",
      })),
    [buildings],
  );

  const selectStyles = useMemo(
    () => ({
      menuPortal: (base) => ({ ...base, zIndex: 1050 }),
      control: (base, state) => ({
        ...base,
        backgroundColor: isDarkMode ? "#1e293b" : "white",
        borderColor: state.isFocused
          ? "#3b82f6"
          : isDarkMode
            ? "#334155"
            : "#e2e8f0",
        color: isDarkMode ? "#f1f5f9" : "#4a5568",
        borderRadius: "8px",
        minHeight: "42px",
        boxShadow: state.isFocused
          ? "0 0 0 3px rgba(59, 130, 246, 0.1)"
          : "none",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }),
      menu: (base) => ({
        ...base,
        backgroundColor: isDarkMode ? "#1e293b" : "white",
        border: isDarkMode ? "1px solid #334155" : "none",
        zIndex: 1050,
      }),
      option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected
          ? "#3b82f6"
          : state.isFocused
            ? isDarkMode
              ? "#334155"
              : "#eff6ff"
            : "transparent",
        color: state.isSelected ? "white" : isDarkMode ? "#f1f5f9" : "#4a5568",
        cursor: "pointer",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }),
      singleValue: (base) => ({
        ...base,
        color: isDarkMode ? "#f1f5f9" : "#4a5568",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }),
      input: (base) => ({
        ...base,
        color: isDarkMode ? "#f1f5f9" : "#4a5568",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }),
      placeholder: (base) => ({
        ...base,
        color: isDarkMode ? "#94a3b8" : "#a0aec0",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }),
    }),
    [isDarkMode],
  );

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
          cost_category: expense.cost_category || "common",
        });
      } catch (err) {
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
          cost_category: isSpecialBuilding ? formData.cost_category : "common",
        })
        .eq("id", expenseId);

      if (error) throw error;
      Swal.fire({
        icon: "success",
        title: "Запазено!",
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
      Swal.fire({
        icon: "success",
        title: "Изтрит!",
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

  if (fetching) {
    return (
      <div
        className={`adm-editexp-overlay ${isDarkMode ? "adm-editexp-dark" : "adm-editexp-light"}`}
        onClick={onClose}
      >
        <div className="adm-editexp-loading-box">Зареждане на данните...</div>
      </div>
    );
  }

  return (
    <div
      className={`adm-editexp-overlay ${isDarkMode ? "adm-editexp-dark" : "adm-editexp-light"}`}
      onClick={(e) =>
        e.target.classList.contains("adm-editexp-overlay") && onClose()
      }
    >
      <div className="adm-editexp-modal adm-editexp-fade-in">
        <div className="adm-editexp-header">
          <div>
            <h1>Редакция на разход</h1>
            <p>Промяна на детайли и статус</p>
          </div>
          <button className="adm-editexp-close-btn" onClick={onClose}>
            <X size={24} strokeWidth={2.5} />
          </button>
        </div>

        <div className="adm-editexp-grid">
          <div className="adm-editexp-card">
            <div className="adm-editexp-section-title">
              <FileText size={20} className="adm-editexp-section-icon" />{" "}
              Основна информация
            </div>

            {isSpecialBuilding && (
              <div
                className="adm-editexp-mode-toggle"
                style={{ marginBottom: "1.5rem", flexWrap: "wrap", gap: "4px" }}
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    className={`adm-editexp-mode-btn ${formData.cost_category === cat.value ? "active" : ""}`}
                    onClick={() => handleChange("cost_category", cat.value)}
                    style={{ fontSize: "0.85rem", padding: "8px 4px" }}
                  >
                    <cat.Icon size={16} strokeWidth={2.5} />
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="adm-editexp-form-group">
              <label>Вид разход *</label>
              <Select
                options={EXPENSE_TYPES}
                value={EXPENSE_TYPES.find((t) => t.value === formData.type)}
                onChange={(opt) => handleChange("type", opt?.value)}
                styles={selectStyles}
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
              <CalendarDays size={20} className="adm-editexp-section-icon" />{" "}
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
                styles={selectStyles}
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
                  menuPortalTarget={document.body}
                />
              </div>
              <div className="adm-editexp-form-group">
                <label>Година</label>
                <Select
                  options={yearOptions}
                  value={yearOptions.find((y) => y.value === formData.year)}
                  onChange={(opt) => handleChange("year", opt?.value)}
                  styles={selectStyles}
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
            <Trash2 size={18} /> Изтрий
          </button>
          <button
            type="button"
            className="adm-editexp-btn adm-editexp-btn-secondary"
            onClick={onClose}
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
