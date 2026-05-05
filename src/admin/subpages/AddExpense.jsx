import { useState, useMemo } from "react";
import Select from "react-select";
import Swal from "sweetalert2";
import { supabase } from "../../supabaseClient";
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
  X,
  Layers,
} from "lucide-react";

import "./styles/AddExpense.css";

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
    <div className="adm-addexp-select-item">
      {shouldShowIcon && (
        <IconComponent
          size={16}
          strokeWidth={2.5}
          className="adm-addexp-select-icon"
          style={{ color: color || "inherit" }}
        />
      )}
      <span>{label}</span>
    </div>
  );
};

function AddExpense({ onClose, onSuccess }) {
  const { isDarkMode } = useTheme();
  const { user: currentUser } = useLocalUser();
  const { buildings, loading: loadingBuildings } = useUserBuildings(
    currentUser?.id,
  );

  const [addMode, setAddMode] = useState("single");

  const [formData, setFormData] = useState({
    type: "",
    current_month: "",
    month: "",
    year: new Date().getFullYear(),
    paid: "не",
    building_id: "",
    notes: "",
  });

  const [multiAmounts, setMultiAmounts] = useState({
    electricity_light: "",
    electricity_lift: "",
    fee_lift: "",
    cleaner: "",
    manager: "",
    custom_type: "",
    custom_amount: "",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

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
      color: "var(--adm-addexp-text-sec)",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }),
  };

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleMultiChange = (name, value) => {
    setMultiAmounts((prev) => ({ ...prev, [name]: value }));
    if (errors.multiple) setErrors((prev) => ({ ...prev, multiple: "" }));
  };

  const handleModeSwitch = (mode) => {
    setAddMode(mode);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.month) newErrors.month = "Изберете месец";
    if (!formData.year) newErrors.year = "Въведете година";
    if (!formData.building_id) newErrors.building_id = "Изберете сграда";

    if (addMode === "single") {
      if (!formData.type) newErrors.type = "Изберете вид разход";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    let expensesToInsert = [];
    const baseContext = {
      month: parseInt(formData.month),
      year: parseInt(formData.year),
      paid: formData.paid,
      building_id: parseInt(formData.building_id),
      notes: formData.notes || "",
    };

    if (addMode === "single") {
      expensesToInsert.push({
        ...baseContext,
        type: formData.type,
        current_month: parseFloat(formData.current_month) || 0,
      });
    } else {
      const predefinedTypes = [
        "electricity_light",
        "electricity_lift",
        "fee_lift",
        "cleaner",
        "manager",
      ];

      predefinedTypes.forEach((type) => {
        if (multiAmounts[type] !== "" && multiAmounts[type] !== null) {
          expensesToInsert.push({
            ...baseContext,
            type: type,
            current_month: parseFloat(multiAmounts[type]) || 0,
          });
        }
      });

      if (multiAmounts.custom_type && multiAmounts.custom_amount !== "") {
        expensesToInsert.push({
          ...baseContext,
          type: multiAmounts.custom_type,
          current_month: parseFloat(multiAmounts.custom_amount) || 0,
        });
      }

      if (expensesToInsert.length === 0) {
        setErrors({ multiple: "Моля, въведете сума за поне един разход." });
        return;
      }
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("expenses")
        .insert(expensesToInsert);
      if (error) throw error;

      await Swal.fire({
        icon: "success",
        title: "Успех!",
        text:
          addMode === "single"
            ? "Разходът е добавен."
            : "Разходите са добавени.",
        timer: 1500,
        showConfirmButton: false,
      });
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Грешка при добавяне:", err.message);
      Swal.fire({ icon: "error", title: "Грешка", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains("adm-addexp-overlay")) {
      onClose();
    }
  };

  return (
    <div
      className={`adm-addexp-overlay ${isDarkMode ? "adm-addexp-dark" : "adm-addexp-light"}`}
      onClick={handleOverlayClick}
    >
      <div className="adm-addexp-modal adm-addexp-fade-in">
        <div className="adm-addexp-header">
          <div>
            <h1>Добавяне на разход(и)</h1>
            <p>Въведете детайли за ново плащане</p>
          </div>
          <button
            className="adm-addexp-close-btn"
            onClick={onClose}
            title="Затвори"
          >
            <X size={24} strokeWidth={2.5} />
          </button>
        </div>

        <div className="adm-addexp-grid">
          <div className="adm-addexp-card">
            <div className="adm-addexp-mode-toggle">
              <button
                className={`adm-addexp-mode-btn ${addMode === "single" ? "active" : ""}`}
                onClick={() => handleModeSwitch("single")}
              >
                <FileText size={18} strokeWidth={2.5} /> Единичен
              </button>
              <button
                className={`adm-addexp-mode-btn ${addMode === "multiple" ? "active" : ""}`}
                onClick={() => handleModeSwitch("multiple")}
              >
                <Layers size={18} strokeWidth={2.5} /> Няколко наведнъж
              </button>
            </div>

            {addMode === "single" ? (
              <>
                <div className="adm-addexp-form-group">
                  <label>Вид разход *</label>
                  <Select
                    options={EXPENSE_TYPES}
                    onChange={(opt) => handleChange("type", opt?.value)}
                    placeholder={
                      <div
                        className="adm-addexp-select-item"
                        style={{ color: "var(--adm-addexp-text-sec)" }}
                      >
                        <FileText
                          size={16}
                          strokeWidth={2.5}
                          className="adm-addexp-select-icon"
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
                    <span className="adm-addexp-error-msg">{errors.type}</span>
                  )}
                </div>

                <div className="adm-addexp-form-group">
                  <label>Сума (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="adm-addexp-input"
                    value={formData.current_month}
                    onChange={(e) =>
                      handleChange("current_month", e.target.value)
                    }
                    placeholder="0.00"
                  />
                </div>
              </>
            ) : (
              <div className="adm-addexp-multi-grid">
                <div className="adm-addexp-form-group">
                  <label>
                    <Lightbulb size={14} /> Ток стълбище (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="adm-addexp-input"
                    placeholder="0.00"
                    value={multiAmounts.electricity_light}
                    onChange={(e) =>
                      handleMultiChange("electricity_light", e.target.value)
                    }
                  />
                </div>
                <div className="adm-addexp-form-group">
                  <label>
                    <Zap size={14} /> Ток асансьор (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="adm-addexp-input"
                    placeholder="0.00"
                    value={multiAmounts.electricity_lift}
                    onChange={(e) =>
                      handleMultiChange("electricity_lift", e.target.value)
                    }
                  />
                </div>
                <div className="adm-addexp-form-group">
                  <label>
                    <ArrowUpDown size={14} /> Сервиз асансьор (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="adm-addexp-input"
                    placeholder="0.00"
                    value={multiAmounts.fee_lift}
                    onChange={(e) =>
                      handleMultiChange("fee_lift", e.target.value)
                    }
                  />
                </div>
                <div className="adm-addexp-form-group">
                  <label>
                    <Sparkles size={14} /> Хигиенист (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="adm-addexp-input"
                    placeholder="0.00"
                    value={multiAmounts.cleaner}
                    onChange={(e) =>
                      handleMultiChange("cleaner", e.target.value)
                    }
                  />
                </div>
                <div className="adm-addexp-form-group">
                  <label>
                    <UserCog size={14} /> Домоуправител (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="adm-addexp-input"
                    placeholder="0.00"
                    value={multiAmounts.manager}
                    onChange={(e) =>
                      handleMultiChange("manager", e.target.value)
                    }
                  />
                </div>

                <div className="adm-addexp-form-group adm-addexp-custom-multi">
                  <label>Допълнителен разход (Избери вид и въведи сума)</label>
                  <div className="adm-addexp-multi-custom-row">
                    <Select
                      className="adm-addexp-multi-select"
                      options={EXPENSE_TYPES.filter(
                        (t) =>
                          ![
                            "electricity_light",
                            "electricity_lift",
                            "fee_lift",
                            "cleaner",
                            "manager",
                          ].includes(t.value),
                      )}
                      onChange={(opt) =>
                        handleMultiChange("custom_type", opt?.value)
                      }
                      placeholder="Вид разход..."
                      styles={selectStyles}
                      isSearchable={false}
                      formatOptionLabel={customFormatOptionLabel}
                      menuPortalTarget={document.body}
                    />
                    <input
                      type="number"
                      step="0.01"
                      className="adm-addexp-input"
                      placeholder="Сума..."
                      value={multiAmounts.custom_amount}
                      onChange={(e) =>
                        handleMultiChange("custom_amount", e.target.value)
                      }
                      disabled={!multiAmounts.custom_type}
                    />
                  </div>
                </div>

                {errors.multiple && (
                  <span
                    className="adm-addexp-error-msg"
                    style={{ gridColumn: "1 / -1" }}
                  >
                    {errors.multiple}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="adm-addexp-card adm-addexp-card-fit">
            <div className="adm-addexp-section-title">
              <CalendarDays
                size={20}
                strokeWidth={2.5}
                className="adm-addexp-section-icon"
              />
              Контекст
            </div>

            <div className="adm-addexp-form-group">
              <label>Сграда *</label>
              <Select
                options={buildingOptions}
                isLoading={loadingBuildings}
                onChange={(opt) => handleChange("building_id", opt?.value)}
                placeholder={
                  <div
                    className="adm-addexp-select-item"
                    style={{ color: "var(--adm-addexp-text-sec)" }}
                  >
                    <Building
                      size={16}
                      strokeWidth={2.5}
                      className="adm-addexp-select-icon"
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
                <span className="adm-addexp-error-msg">
                  {errors.building_id}
                </span>
              )}
            </div>

            <div className="adm-addexp-dates-grid">
              <div className="adm-addexp-form-group">
                <label>Месец *</label>
                <Select
                  options={monthOptions}
                  onChange={(opt) => handleChange("month", opt?.value)}
                  styles={selectStyles}
                  isSearchable={false}
                  placeholder={
                    <div
                      className="adm-addexp-select-item"
                      style={{ color: "var(--adm-addexp-text-sec)" }}
                    >
                      <CalendarDays
                        size={16}
                        strokeWidth={2.5}
                        className="adm-addexp-select-icon"
                      />
                      <span>--</span>
                    </div>
                  }
                  menuPlacement="auto"
                  formatOptionLabel={customFormatOptionLabel}
                  menuPortalTarget={document.body}
                />
                {errors.month && (
                  <span className="adm-addexp-error-msg">{errors.month}</span>
                )}
              </div>

              <div className="adm-addexp-form-group">
                <label>Година</label>
                <Select
                  options={yearOptions}
                  defaultValue={yearOptions[0]}
                  onChange={(opt) => handleChange("year", opt?.value)}
                  styles={selectStyles}
                  isSearchable={false}
                  menuPlacement="auto"
                  formatOptionLabel={customFormatOptionLabel}
                  menuPortalTarget={document.body}
                />
              </div>
            </div>

            <hr className="adm-addexp-divider" />

            <div className="adm-addexp-form-group">
              <label>Статус на плащане</label>
              <Select
                options={PAID_OPTIONS}
                defaultValue={PAID_OPTIONS[0]}
                onChange={(opt) => handleChange("paid", opt?.value)}
                styles={selectStyles}
                isSearchable={false}
                formatOptionLabel={customFormatOptionLabel}
                menuPortalTarget={document.body}
              />
            </div>

            <div
              className="adm-addexp-form-group"
              style={{ marginTop: "0.5rem" }}
            >
              <label>Общи Бележки</label>
              <textarea
                name="notes"
                className="adm-addexp-textarea adm-addexp-notes-textarea"
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Приложени за всички разходи..."
              />
            </div>
          </div>
        </div>

        <div className="adm-addexp-actions">
          <button
            className="adm-addexp-btn adm-addexp-btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Отказ
          </button>
          <button
            className="adm-addexp-btn adm-addexp-btn-primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading
              ? "Запазване..."
              : addMode === "single"
                ? "Добави разход"
                : "Добави разходите"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddExpense;
