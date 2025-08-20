import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../../supabaseClient"
import "./styles/AddExpense.css"

function AddExpense() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        type: "",
        month: "",
        year: new Date().getFullYear(),
        current_month: "",
        paid: "не",
        building_id: "",
        notes: "",
    });

    const [buildings, setBuildings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        async function fetchBuildings() {
            const { data, error } = await supabase.from("buildings").select("id, name");
            if (error) {
                console.error("Грешка при зареждане на сгради:", error);
            } else {
                setBuildings(data);
            }
        }
        fetchBuildings();
    }, []);

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
            const { error } = await supabase.from("expenses").insert([{
                type: formData.type,
                month: formData.month,
                year: parseInt(formData.year),
                current_month: parseFloat(formData.current_month) || 0,
                paid: formData.paid,
                building_id: parseInt(formData.building_id),
                notes: formData.notes,
            }]);

            if (error) throw error;
            navigate("/admin/expenses");
        } catch (err) {
            console.error("Грешка при добавяне на разход:", err.message);
            alert("Възникна грешка: " + err.message);
        } finally {
            setLoading(false);
        }
    }

    const months = [
        "Януари", "Февруари", "Март", "Април",
        "Май", "Юни", "Юли", "Август",
        "Септември", "Октомври", "Ноември", "Декември"
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    return (
        <div className="add-expense-container">
            <div className="form-header">
                <h1>Добавяне на нов разход</h1>
                <p>Попълнете формата за добавяне на нов разход</p>
            </div>

            <form className="expense-form" onSubmit={handleSubmit}>
                <div className="form-grid">
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



                    <div className={`form-group ${errors.month ? 'has-error' : ''}`}>
                        <label htmlFor="month">Месец *</label>
                        <select
                            id="month"
                            name="month"
                            value={formData.month}
                            onChange={handleChange}
                        >
                            <option value="">-- Избери месец --</option>
                            {months.map((m) => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                        {errors.month && <span className="error-message">{errors.month}</span>}
                    </div>

                    <div className={`form-group ${errors.year ? 'has-error' : ''}`}>
                        <label htmlFor="year">Година *</label>
                        <select
                            id="year"
                            name="year"
                            value={formData.year}
                            onChange={handleChange}
                        >
                            {years.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                        {errors.year && <span className="error-message">{errors.year}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="current_month">Сума (лв)</label>
                        <div className="input-with-icon">
                            <input
                                id="current_month"
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
                        <label htmlFor="paid">Статус на плащане</label>
                        <select
                            id="paid"
                            name="paid"
                            value={formData.paid}
                            onChange={handleChange}
                        >
                            <option value="не">Чака плащане</option>
                            <option value="да">Платено</option>
                        </select>
                    </div>

                    <div className={`form-group ${errors.building_id ? 'has-error' : ''}`}>
                        <label htmlFor="building_id">Сграда *</label>
                        <select
                            id="building_id"
                            name="building_id"
                            value={formData.building_id}
                            onChange={handleChange}
                        >
                            <option value="">-- Избери сграда --</option>
                            {buildings.map((b) => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                        {errors.building_id && <span className="error-message">{errors.building_id}</span>}
                    </div>

                    <div className="form-group full-width">
                        <label htmlFor="notes">Допълнителни бележки</label>
                        <textarea
                            id="notes"
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            placeholder="Например: плащане за конкретен ремонт..."
                        />
                    </div>


                </div>

                <div className="form-actions">
                    <button
                        type="button"
                        className="secondary-button"
                        onClick={() => navigate("/admin/expenses")}
                    >
                        Отказ
                    </button>
                    <button
                        type="submit"
                        className="primary-button"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="spinner"></span>
                                Запазване...
                            </>
                        ) : 'Запази разход'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default AddExpense;