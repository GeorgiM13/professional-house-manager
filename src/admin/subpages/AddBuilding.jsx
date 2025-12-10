import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { supabase } from "../../supabaseClient";
import { useTheme } from "../../components/ThemeContext";
import "./styles/AddBuilding.css";

function AddBuilding() {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    floors: "",
    apartments: "",
    garages: "",
    offices: "",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: null });
    }
  };

  const handleSubmit = async () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Името е задължително";
    if (!formData.address.trim()) newErrors.address = "Адресът е задължителен";
    if (!formData.floors) newErrors.floors = "Въведете брой етажи";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const newBuilding = {
        name: formData.name,
        address: formData.address,
        floors: parseInt(formData.floors) || 0,
        apartments: parseInt(formData.apartments) || 0,
        garages: formData.garages ? parseInt(formData.garages) : 0,
        offices: formData.offices ? parseInt(formData.offices) : 0,
        created_at: new Date(),
      };

      const { error } = await supabase.from("buildings").insert([newBuilding]);

      if (error) throw error;

      await Swal.fire({
        title: "Успех!",
        text: "Сградата е добавена успешно.",
        icon: "success",
        confirmButtonColor: "#3b82f6",
        timer: 2000,
      });

      navigate("/admin/buildings");
    } catch (error) {
      console.error("Supabase insert error:", error);
      await Swal.fire({
        title: "Грешка",
        text: error.message,
        icon: "error",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => navigate("/admin/buildings");

  return (
    <div className={`adb-container ${isDarkMode ? "au-dark" : "au-light"}`}>
      <div className="adb-header">
        <div>
          <h1>Добавяне на сграда</h1>
          <p>Въведете данни за новата етажна собственост</p>
        </div>
        <button className="adb-btn adb-btn-secondary" onClick={goBack}>
          Назад
        </button>
      </div>

      <div className="adb-card">
        <div className="adb-section-title">🏢 Основна информация</div>

        <div className="adb-grid-row">
          <div className="adb-form-group">
            <label>Име на сградата *</label>
            <input
              name="name"
              className="adb-input"
              type="text"
              value={formData.name}
              onChange={handleChange}
            />
            {errors.name && <span className="error-msg">{errors.name}</span>}
          </div>
          <div className="adb-form-group">
            <label>Адрес *</label>
            <input
              name="address"
              className="adb-input"
              type="text"
              value={formData.address}
              onChange={handleChange}
            />
            {errors.address && (
              <span className="error-msg">{errors.address}</span>
            )}
          </div>
        </div>

        <div className="adb-section-title" style={{ marginTop: "1rem" }}>
          📊 Параметри
        </div>

        <div className="adb-grid-row">
          <div className="adb-form-group">
            <label>Брой етажи *</label>
            <input
              name="floors"
              className="adb-input"
              type="number"
              value={formData.floors}
              onChange={handleChange}
              placeholder="0"
            />
            {errors.floors && (
              <span className="error-msg">{errors.floors}</span>
            )}
          </div>
          <div className="adb-form-group">
            <label>Брой апартаменти</label>
            <input
              name="apartments"
              className="adb-input"
              type="number"
              value={formData.apartments}
              onChange={handleChange}
              placeholder="0"
            />
          </div>
        </div>

        <div className="adb-grid-row">
          <div className="adb-form-group">
            <label>Брой гаражи</label>
            <input
              name="garages"
              className="adb-input"
              type="number"
              value={formData.garages}
              onChange={handleChange}
              placeholder="0"
            />
          </div>
          <div className="adb-form-group">
            <label>Брой офиси</label>
            <input
              name="offices"
              className="adb-input"
              type="number"
              value={formData.offices}
              onChange={handleChange}
              placeholder="0"
            />
          </div>
        </div>

        <div className="adb-actions">
          <button
            type="button"
            className="adb-btn adb-btn-secondary"
            onClick={goBack}
            disabled={loading}
          >
            Отказ
          </button>
          <button
            type="button"
            className="adb-btn adb-btn-primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Запазване..." : "Добави сградата"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddBuilding;
