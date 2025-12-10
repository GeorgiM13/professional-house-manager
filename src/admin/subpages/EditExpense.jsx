import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Select from "react-select";
import Swal from "sweetalert2";
import { supabase } from "../../supabaseClient";
import ConfirmModal from "../../components/ConfirmModal";
import { useTheme } from "../../components/ThemeContext";
import { useUserBuildings } from "../hooks/UseUserBuildings";
import { useLocalUser } from "../hooks/UseLocalUser";

import "./styles/EditExpense.css";

function EditExpense() {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const { id } = useParams();

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
  const [fetching, setFetching] = useState(true);
  const [errors, setErrors] = useState({});
  const [showConfirm, setShowConfirm] = useState(false);

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
  const years = Array.from({ length: 6 }, (_, i) => currentYear + 1 - i);

  const buildingOptions = useMemo(() => {
    return buildings.map((b) => ({
      value: b.id,
      label: `${b.name}, ${b.address}`,
    }));
  }, [buildings]);

  useEffect(() => {
    async function fetchExpense() {
      try {
        const { data: expense, error } = await supabase
          .from("expenses")
          .select("*")
          .eq("id", id)
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
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
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
        .eq("id", id);

      if (error) throw error;

      await Swal.fire({
        icon: "success",
        title: "Запазено!",
        text: "Промените са отразени успешно.",
        timer: 1500,
        showConfirmButton: false,
      });
      navigate("/admin/expenses");
    } catch (err) {
      Swal.fire({ icon: "error", title: "Грешка", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirmed = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
      await Swal.fire({
        icon: "success",
        title: "Изтрит!",
        text: "Разходът е премахнат успешно.",
        timer: 1500,
        showConfirmButton: false,
      });
      navigate("/admin/expenses");
    } catch (err) {
      Swal.fire({ icon: "error", title: "Грешка", text: err.message });
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  const goBack = () => navigate("/admin/expenses");

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

  if (fetching)
    return (
      <div className={`ede-container ${isDarkMode ? "au-dark" : "au-light"}`}>
        <div style={{ textAlign: "center", padding: "4rem" }}>
          Зареждане на данните...
        </div>
      </div>
    );

  return (
    <div className={`ede-container ${isDarkMode ? "au-dark" : "au-light"}`}>
      <div className="ede-header">
        <div>
          <h1>Редакция на разход</h1>
          <p>Промяна на детайли и статус</p>
        </div>
        <button className="ede-btn ede-btn-secondary" onClick={goBack}>
          Назад
        </button>
      </div>

      <div className="ede-grid">
        <div className="ede-card">
          <div className="ede-section-title">📄 Основна информация</div>

          <div className="ede-form-group">
            <label>Вид разход *</label>
            <select
              name="type"
              className="ede-select"
              value={formData.type}
              onChange={handleChange}
            >
              <option value="">-- Избери --</option>
              <option value="electricity_lift">Ток асансьор</option>
              <option value="fee_lift">Сервиз асансьор</option>
              <option value="electricity_light">Ток осветление</option>
              <option value="cleaner">Хигиенист</option>
              <option value="repair">Ремонт</option>
              <option value="manager">Домоуправител</option>
              <option value="water_building">Вода обща</option>
              <option value="lighting">Осветление (консумативи)</option>
              <option value="cleaning_supplies">Материали почистване</option>
              <option value="fee_annual_review">
                Годишен преглед асансьор
              </option>
              <option value="internet_video">Интернет / Видео</option>
              <option value="access_control">Контрол достъп</option>
              <option value="pest_control">Дезинсекция</option>
              <option value="other">Други</option>
            </select>
            {errors.type && <span className="error-msg">{errors.type}</span>}
          </div>

          <div className="ede-form-group">
            <label>Сума (лв)</label>
            <input
              type="number"
              step="0.01"
              name="current_month"
              className="ede-input"
              value={formData.current_month}
              onChange={handleChange}
              placeholder="0.00"
            />
          </div>

          <div className="ede-form-group">
            <label>Бележки</label>
            <textarea
              name="notes"
              className="ede-textarea"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Допълнителна информация за разхода..."
            />
          </div>
        </div>

        <div className="ede-card" style={{ height: "fit-content" }}>
          <div className="ede-section-title">📅 Контекст</div>

          <div className="ede-form-group">
            <label>Сграда *</label>
            <Select
              options={buildingOptions}
              isLoading={loadingBuildings}
              value={buildingOptions.find(
                (op) => op.value === formData.building_id
              )}
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
            <div className="ede-form-group">
              <label>Месец *</label>
              <select
                name="month"
                className="ede-select"
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

            <div className="ede-form-group">
              <label>Година</label>
              <select
                name="year"
                className="ede-select"
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

          <div className="ede-form-group">
            <label>Статус на плащане</label>
            <select
              name="paid"
              className="ede-select"
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

        <div className="ede-actions">
          <button
            type="button"
            className="ede-btn ede-btn-danger"
            onClick={() => setShowConfirm(true)}
            disabled={loading}
            style={{ marginRight: "auto" }}
          >
            🗑️ Изтрий
          </button>
          <button
            type="button"
            className="ede-btn ede-btn-secondary"
            onClick={goBack}
            disabled={loading}
          >
            Отказ
          </button>
          <button
            type="button"
            className="ede-btn ede-btn-primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Запазване..." : "Запази промените"}
          </button>
        </div>
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
  );
}

export default EditExpense;
