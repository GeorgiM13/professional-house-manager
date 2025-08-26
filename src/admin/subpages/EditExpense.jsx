import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import AsyncSelect from "react-select/async"
import { supabase } from "../../supabaseClient"
import "./styles/EditExpense.css"

function EditExpense() {
  const navigate = useNavigate();
  const { id } = useParams();
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
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [errors, setErrors] = useState({});

  const months = [
    "Януари", "Февруари", "Март", "Април",
    "Май", "Юни", "Юли", "Август",
    "Септември", "Октомври", "Ноември", "Декември"
  ];

  const currentYear = new Date().getFullYear();
  const nextYear = new Date().getFullYear() + 1;
  const years = Array.from({ length: 6 }, (_, i) => nextYear - i);

  const loadBuildings = async (inputValue) => {
    const { data } = await supabase
      .from("buildings")
      .select("id, name, address")
      .ilike("name", `%${inputValue || ""}%`)
      .limit(10);
    return data.map(b => ({ value: b.id, label: `${b.name}, ${b.address}` }));
  };

  useEffect(() => {
    async function fetchExpense() {
      try {
        const { data: expense, error } = await supabase
          .from("expenses")
          .select("*, building:buildings(name,address)")
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
          building_label: expense.building ? `${expense.building.name}, ${expense.building.address}` : "",
          notes: expense.notes || "",
        });
      } catch (err) {
        console.error(err);
        alert("Грешка при зареждане на разхода");
      } finally {
        setIsLoadingData(false);
      }
    }

    fetchExpense();
  }, [id]);

  async function handleDelete() {
    if (!window.confirm("Сигурни ли сте, че искате да изтриете този разход?")) {
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", id);

      if (error) throw error;

      navigate("/admin/expenses");
    } catch (err) {
      console.error("Грешка при изтриване на разход:", err.message);
      alert("Възникна грешка при изтриване: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const newErrors = {};
    if (!formData.type) newErrors.type = 'Моля въведете вид разход';
    if (!formData.month) newErrors.month = 'Моля изберете месец';
    if (!formData.year) newErrors.year = 'Моля въведете година';
    if (!formData.building_id) newErrors.building_id = 'Моля изберете сграда';

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

      navigate("/admin/expenses");
    } catch (err) {
      console.error("Грешка при обновяване на разход:", err.message);
      alert("Възникна грешка: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  if (isLoadingData) {
    return <div className="loading-text">Зареждане на данните...</div>;
  }

  return (
    <div className="edit-expense-container">
      <h1 className="page-title">Редакция на разход</h1>

      <form className="edit-expense-form" onSubmit={handleSubmit}>
        <div className={`form-group ${errors.type ? 'has-error' : ''}`}>
          <label htmlFor="type">Вид разход *</label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
          >
            <option value="">-- Избери разход --</option>
            <option value="electricity_lift">Ток асансьор</option>
            <option value="fee_lift">Сервиз асансьор</option>
            <option value="electricity_light">Ток осветление</option>
            <option value="cleaner">Хигиенист</option>
            <option value="other">Други</option>
          </select>
          {errors.type && <span className="error-message">{errors.type}</span>}
        </div>

        <div className="form-group">
          <label>Месец *</label>
          <select
            name="month"
            value={formData.month}
            onChange={handleChange}
            className={errors.month ? 'error' : ''}
          >
            <option value="">-- Избери месец --</option>
            {months.map((m, index) => (
              <option key={index + 1} value={index + 1}>{m}</option>
            ))}
          </select>
          {errors.month && <span className="error-message">{errors.month}</span>}
        </div>

        <div className="form-group">
          <label>Година *</label>
          <select
            name="year"
            value={formData.year}
            onChange={handleChange}
            className={errors.year ? 'error' : ''}
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          {errors.year && <span className="error-message">{errors.year}</span>}
        </div>

        <div className="form-group">
          <label>Сума (лв)</label>
          <div className="input-with-icon">
            <input
              type="number"
              step="0.01"
              name="current_month"
              value={formData.current_month}
              onChange={handleChange}
              placeholder="0.00"
            />
            <span className="currency">лв.</span>
          </div>
        </div>

        <div className="form-group">
          <label>Статус на плащане</label>
          <select
            name="paid"
            value={formData.paid}
            onChange={handleChange}
          >
            <option value="не">Чака плащане</option>
            <option value="да">Платено</option>
          </select>
        </div>

        <div className="form-group">
          <label>Сграда *</label>
          <AsyncSelect
            className="custom-select"
            classNamePrefix="custom"
            cacheOptions
            defaultOptions
            loadOptions={loadBuildings}
            value={formData.building_id ? { value: formData.building_id, label: formData.building_label } : null}
            onChange={(option) => {
              setFormData(prev => ({
                ...prev,
                building_id: option?.value || "",
                building_label: option?.label || ""
              }));
              if (errors.building_id) setErrors(prev => ({ ...prev, building_id: "" }));
            }}
            placeholder="Изберете сграда"
            isClearable
          />
          {errors.building_id && <span className="error-message">{errors.building_id}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="notes">Допълнителни бележки</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Например: плащане за конкретен ремонт..."
          />
        </div>

        <div className="form-buttons">
          <button type="submit" className="btn primary" disabled={loading}>
            {loading ? 'Запазване...' : 'Запази промените'}
          </button>
          <button type="button" className="btn secondary" onClick={() => navigate("/admin/expenses")}>
            Отказ
          </button>
          <button type="button" className="btn danger" onClick={handleDelete} disabled={loading}>
            Изтрий разход
          </button>
        </div>

      </form>
    </div>
  );
}

export default EditExpense;