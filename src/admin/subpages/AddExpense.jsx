import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import Swal from "sweetalert2";
import { supabase } from "../../supabaseClient";
import { useTheme } from "../../components/ThemeContext";
import { useUserBuildings } from "../hooks/UseUserBuildings";
import { useLocalUser } from "../hooks/UseLocalUser";

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
  { value: "electricity_lift", label: "⚡ Ток асансьор" },
  { value: "fee_lift", label: "🛗 Сервиз асансьор" },
  { value: "electricity_light", label: "💡 Ток осветление" },
  { value: "cleaner", label: "🧹 Хигиенист" },
  { value: "repair", label: "🛠️ Ремонт" },
  { value: "manager", label: "👨‍💼 Домоуправител" },
  { value: "water_building", label: "💧 Вода обща" },
  { value: "lighting", label: "💡 Осветление (консумативи)" },
  { value: "cleaning_supplies", label: "🧽 Материали почистване" },
  { value: "fee_annual_review", label: "📋 Годишен преглед асансьор" },
  { value: "internet_video", label: "📡 Интернет / Видео" },
  { value: "access_control", label: "🔑 Контрол достъп" },
  { value: "pest_control", label: "🕷️ Дезинсекция" },
  { value: "other", label: "📦 Други" },
];

const PAID_OPTIONS = [
  { value: "не", label: "🔴 Неплатено", color: "#ef4444" },
  { value: "да", label: "🟢 Платено", color: "#10b981" },
];

function AddExpense() {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  const { user: currentUser } = useLocalUser();
  const { buildings, loading: loadingBuildings } = useUserBuildings(
    currentUser?.id
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
  const [errors, setErrors] = useState({});

  const currentYear = new Date().getFullYear();
  const yearOptions = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => currentYear + 1 - i).map((y) => ({
        value: y,
        label: `${y}`,
      })),
    [currentYear]
  );

  const monthOptions = useMemo(
    () =>
      Object.entries(MONTH_NAMES).map(([k, v]) => ({
        value: parseInt(k),
        label: v,
      })),
    []
  );

  const buildingOptions = useMemo(() => {
    return buildings.map((b) => ({
      value: b.id,
      label: `${b.name}, ${b.address}`,
    }));
  }, [buildings]);

  const selectStyles = {
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
    }),
    menu: (base) => ({
      ...base,
      background: isDarkMode ? "#1e293b" : "white",
      zIndex: 9999,
      border: isDarkMode ? "1px solid #334155" : "1px solid #e2e8f0",
    }),
    option: (base, state) => {
      if (state.isSelected) {
        return {
          ...base,
          backgroundColor: "#3b82f6",
          color: "white",
          cursor: "pointer",
        };
      }
      if (state.isFocused) {
        return {
          ...base,
          backgroundColor: isDarkMode ? "#334155" : "#eff6ff",
          color: isDarkMode ? "#f1f5f9" : "#1e293b",
          cursor: "pointer",
        };
      }
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
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!formData.type) newErrors.type = "Моля въведете вид разход";
    if (!formData.month) newErrors.month = "Моля изберете месец";
    if (!formData.year) newErrors.year = "Моля въведете година";
    if (!formData.building_id) newErrors.building_id = "Моля изберете сграда";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from("expenses").insert([
        {
          type: formData.type,
          month: parseInt(formData.month),
          year: parseInt(formData.year),
          current_month: parseFloat(formData.current_month) || 0,
          paid: formData.paid,
          building_id: parseInt(formData.building_id),
          notes: formData.notes,
        },
      ]);

      if (error) throw error;

      await Swal.fire({
        icon: "success",
        title: "Успех!",
        text: "Разходът е добавен успешно.",
        timer: 1500,
        showConfirmButton: false,
      });
      navigate("/admin/expenses");
    } catch (err) {
      console.error("Грешка при добавяне на разход:", err.message);
      Swal.fire({ icon: "error", title: "Грешка", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => navigate("/admin/expenses");

  return (
    <div className={`ade-container ${isDarkMode ? "au-dark" : "au-light"}`}>
      <div className="ade-header">
        <div>
          <h1>Добавяне на разход</h1>
          <p>Въведете детайли за новото плащане</p>
        </div>
        <button className="ade-btn ade-btn-secondary" onClick={goBack}>
          Назад
        </button>
      </div>

      <div className="ade-grid">
        <div className="ade-card">
          <div className="ade-section-title">📄 Основна информация</div>

          <div className="ade-form-group">
            <label>Вид разход *</label>
            <Select
              options={EXPENSE_TYPES}
              onChange={(opt) => handleChange("type", opt?.value)}
              placeholder="Избери вид..."
              styles={selectStyles}
              isSearchable={false}
            />
            {errors.type && <span className="error-msg">{errors.type}</span>}
          </div>

          <div className="ade-form-group">
            <label>Сума (лв)</label>
            <input
              type="number"
              step="0.01"
              name="current_month"
              className="ade-input"
              value={formData.current_month}
              onChange={(e) => handleChange("current_month", e.target.value)}
            />
          </div>

          <div className="ade-form-group">
            <label>Бележки</label>
            <textarea
              name="notes"
              className="ade-textarea"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Допълнителна информация..."
            />
          </div>
        </div>

        <div className="ade-card" style={{ height: "fit-content" }}>
          <div className="ade-section-title">📅 Контекст</div>

          <div className="ade-form-group">
            <label>Сграда *</label>
            <Select
              options={buildingOptions}
              isLoading={loadingBuildings}
              onChange={(opt) => handleChange("building_id", opt?.value)}
              placeholder="Избери сграда..."
              styles={selectStyles}
              noOptionsMessage={() => "Няма намерени"}
            />
            {errors.building_id && (
              <span className="error-msg">{errors.building_id}</span>
            )}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
              marginTop: "0.5rem",
            }}
          >
            <div className="ade-form-group">
              <label>Месец *</label>
              <Select
                options={monthOptions}
                onChange={(opt) => handleChange("month", opt?.value)}
                styles={selectStyles}
                isSearchable={false}
                placeholder="--"
                menuPlacement="auto"
              />
              {errors.month && (
                <span className="error-msg">{errors.month}</span>
              )}
            </div>

            <div className="ade-form-group">
              <label>Година</label>
              <Select
                options={yearOptions}
                defaultValue={yearOptions[0]}
                onChange={(opt) => handleChange("year", opt?.value)}
                styles={selectStyles}
                isSearchable={false}
                menuPlacement="auto"
              />
            </div>
          </div>

          <hr
            style={{
              margin: "1rem 0",
              border: "0",
              borderTop: "1px dashed var(--au-border)",
            }}
          />

          <div className="ade-form-group">
            <label>Статус на плащане</label>
            <Select
              options={PAID_OPTIONS}
              defaultValue={PAID_OPTIONS[0]}
              onChange={(opt) => handleChange("paid", opt?.value)}
              styles={selectStyles}
              isSearchable={false}
            />
          </div>
        </div>

        <div className="ade-actions">
          <button className="ade-btn ade-btn-secondary" onClick={goBack}>
            Отказ
          </button>
          <button
            className="ade-btn ade-btn-primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Запазване..." : "Добави разход"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddExpense;
