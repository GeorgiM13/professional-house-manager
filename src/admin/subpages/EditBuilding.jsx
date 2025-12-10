import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import CustomAlert from "../../components/CustomAlert";
import ConfirmModal from "../../components/ConfirmModal";
import { useTheme } from "../../components/ThemeContext";
import "./styles/EditBuilding.css";

function EditBuilding() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    floors: "",
    apartments: "",
    garages: "",
    offices: "",
  });

  const [alert, setAlert] = useState({
    show: false,
    message: "",
    type: "info",
  });
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBuilding();
  }, [id]);

  const fetchBuilding = async () => {
    const { data, error } = await supabase
      .from("buildings")
      .select("name, address, floors, apartments, garages, offices")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error loading building:", error);
      setAlert({
        show: true,
        message: "Грешка при зареждане: " + error.message,
        type: "error",
      });
    } else if (data) {
      setFormData({
        name: data.name || "",
        address: data.address || "",
        floors: data.floors || "",
        apartments: data.apartments || "",
        garages: data.garages || "",
        offices: data.offices || "",
      });
    }
    setLoading(false);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);

    const { name, address, floors, apartments, garages, offices } = formData;

    const updates = {
      name,
      address,
      floors: parseInt(floors) || 0,
      apartments: parseInt(apartments) || 0,
      garages: parseInt(garages) || 0,
      offices: parseInt(offices) || 0,
    };

    const { error } = await supabase
      .from("buildings")
      .update(updates)
      .eq("id", id);

    if (error) {
      console.error("Update error:", error);
      setAlert({
        show: true,
        message: "Грешка при редакция: " + error.message,
        type: "error",
      });
      setSaving(false);
    } else {
      setAlert({
        show: true,
        message: "✅ Сградата е обновена успешно!",
        type: "success",
      });
      setTimeout(() => navigate("/admin/buildings"), 1500);
    }
  };

  const handleDeleteConfirmed = async () => {
    setSaving(true);
    const { error } = await supabase.from("buildings").delete().eq("id", id);

    if (error) {
      setAlert({
        show: true,
        message: "Грешка при изтриване: " + error.message,
        type: "error",
      });
      setSaving(false);
    } else {
      setAlert({
        show: true,
        message: "🗑️ Сградата е изтрита успешно!",
        type: "success",
      });
      setTimeout(() => navigate("/admin/buildings"), 1500);
    }
    setShowConfirm(false);
  };

  const goBack = () => navigate("/admin/buildings");

  if (loading) {
    return (
      <div className={`edb-container ${isDarkMode ? "au-dark" : "au-light"}`}>
        <div
          style={{
            textAlign: "center",
            marginTop: "4rem",
            color: "var(--au-text-sec)",
          }}
        >
          Зареждане на данни...
        </div>
      </div>
    );
  }

  return (
    <div className={`edb-container ${isDarkMode ? "au-dark" : "au-light"}`}>
      <div className="edb-header">
        <div>
          <h1>Редакция на сграда</h1>
          <p>Промяна на параметрите на етажната собственост</p>
        </div>
        <button className="edb-btn edb-btn-secondary" onClick={goBack}>
          Назад
        </button>
      </div>

      <div className="edb-card">
        <div className="edb-section-title">🏢 Основна информация</div>

        <div className="edb-grid-row">
          <div className="edb-form-group">
            <label>Име на сградата</label>
            <input
              className="edb-input"
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>
          <div className="edb-form-group">
            <label>Адрес</label>
            <input
              className="edb-input"
              type="text"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              required
            />
          </div>
        </div>

        <div className="edb-section-title" style={{ marginTop: "1rem" }}>
          📊 Параметри
        </div>

        <div className="edb-grid-row">
          <div className="edb-form-group">
            <label>Брой етажи</label>
            <input
              className="edb-input"
              type="number"
              value={formData.floors}
              onChange={(e) =>
                setFormData({ ...formData, floors: e.target.value })
              }
              required
            />
          </div>
          <div className="edb-form-group">
            <label>Брой апартаменти</label>
            <input
              className="edb-input"
              type="number"
              value={formData.apartments}
              onChange={(e) =>
                setFormData({ ...formData, apartments: e.target.value })
              }
            />
          </div>
        </div>

        <div className="edb-grid-row">
          <div className="edb-form-group">
            <label>Брой гаражи</label>
            <input
              className="edb-input"
              type="number"
              value={formData.garages}
              onChange={(e) =>
                setFormData({ ...formData, garages: e.target.value })
              }
            />
          </div>
          <div className="edb-form-group">
            <label>Брой офиси</label>
            <input
              className="edb-input"
              type="number"
              value={formData.offices}
              onChange={(e) =>
                setFormData({ ...formData, offices: e.target.value })
              }
            />
          </div>
        </div>

        <div className="edb-actions">
          <button
            type="button"
            className="edb-btn edb-btn-danger"
            onClick={() => setShowConfirm(true)}
            disabled={saving}
          >
            🗑️ Изтрий сградата
          </button>
          <button
            className="edb-btn edb-btn-primary"
            onClick={handleUpdate}
            disabled={saving}
          >
            {saving ? "Запазване..." : "Запази промените"}
          </button>
        </div>
      </div>

      <CustomAlert
        message={alert.message}
        type={alert.type}
        visible={alert.show}
        onClose={() => setAlert({ ...alert, show: false })}
      />

      {showConfirm && (
        <ConfirmModal
          title="Изтриване на сграда"
          message="Наистина ли искате да изтриете тази сграда и всички свързани с нея данни?"
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}

export default EditBuilding;
