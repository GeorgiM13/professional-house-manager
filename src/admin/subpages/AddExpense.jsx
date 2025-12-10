import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import Swal from "sweetalert2";
import { supabase } from "../../supabaseClient";
import { useTheme } from "../../components/ThemeContext";
import { useUserBuildings } from "../hooks/UseUserBuildings";
import { useLocalUser } from "../hooks/UseLocalUser";

import "./styles/AddExpense.css";

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

  const months = [
    "Януари",
    "Февруари",
    "Март",
    "Април",
    "Май",
    "Юни",
    "Юли",
    "Август",
    "Септември",
    "Октомври",
    "Ноември",
    "Декември",
  ];
  const currentYear = new Date().getFullYear();
  const nextYear = new Date().getFullYear() + 1;
  const years = Array.from({ length: 6 }, (_, i) => nextYear - i);

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
        ? "var(--au-primary)"
        : isDarkMode
        ? "#334155"
        : "#cbd5e1",
      color: isDarkMode ? "#f1f5f9" : "#1e293b",
      minHeight: "42px",
      borderRadius: "8px",
    }),
    menu: (base) => ({
      ...base,
      background: isDarkMode ? "#1e293b" : "white",
      zIndex: 999,
      border: "1px solid var(--au-border)",
    }),
    option: (base, state) => ({
      ...base,
      background: state.isFocused
        ? isDarkMode
          ? "#334155"
          : "#eff6ff"
        : "transparent",
      color: isDarkMode ? "#f1f5f9" : "#334155",
      cursor: "pointer",
    }),
    singleValue: (base) => ({
      ...base,
      color: isDarkMode ? "#f1f5f9" : "#334155",
    }),
    input: (base) => ({ ...base, color: isDarkMode ? "#f1f5f9" : "#334155" }),
    placeholder: (base) => ({ ...base, color: "var(--au-text-sec)" }),
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
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
            <select
              name="type"
              className="ade-select"
              value={formData.type}
              onChange={handleChange}
            >
              <option value="">-- Избери разход --</option>
              <option value="electricity_lift">Ток асансьор</option>
              <option value="fee_lift">Сервиз асансьор</option>
              <option value="electricity_light">Ток осветление</option>
              <option value="cleaner">Хигиенист</option>
              <option value="repair">Ремонт</option>
              <option value="manager">Домоуправител</option>
              <option value="water_building">Вода обща</option>
              <option value="lighting">Осветление (Пури/Крушки)</option>
              <option value="cleaning_supplies">Материали почистване</option>
              <option value="fee_annual_review">
                Годишен преглед асансьор
              </option>
              <option value="internet_video">Интернет и Видеонаблюдение</option>
              <option value="access_control">Контрол на достъп (Чипове)</option>
              <option value="pest_control">Дезинсекция (Пръскане)</option>
              <option value="other">Други</option>
            </select>
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
              onChange={handleChange}
              placeholder="0.00"
            />
          </div>

          <div className="ade-form-group">
            <label>Бележки</label>
            <textarea
              name="notes"
              className="ade-textarea"
              value={formData.notes}
              onChange={handleChange}
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
              onChange={(opt) => {
                setFormData((prev) => ({
                  ...prev,
                  building_id: opt?.value || "",
                }));
                if (errors.building_id)
                  setErrors((prev) => ({ ...prev, building_id: null }));
              }}
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
              <select
                name="month"
                className="ade-select"
                value={formData.month}
                onChange={handleChange}
              >
                <option value="">--</option>
                {months.map((m, i) => (
                  <option key={i + 1} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
              {errors.month && (
                <span className="error-msg">{errors.month}</span>
              )}
            </div>

            <div className="ade-form-group">
              <label>Година *</label>
              <select
                name="year"
                className="ade-select"
                value={formData.year}
                onChange={handleChange}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
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
            <select
              name="paid"
              className="ade-select"
              value={formData.paid}
              onChange={handleChange}
              style={{
                fontWeight: "600",
                color: formData.paid === "да" ? "#10b981" : "#ef4444",
              }}
            >
              <option value="не">🔴 Неплатено</option>
              <option value="да">🟢 Платено</option>
            </select>
          </div>
        </div>

        <div className="ade-actions">
          <button
            type="button"
            className="ade-btn ade-btn-secondary"
            onClick={goBack}
            disabled={loading}
          >
            Отказ
          </button>
          <button
            type="button"
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
