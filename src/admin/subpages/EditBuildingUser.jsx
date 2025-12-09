import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import AsyncSelect from "react-select/async";
import { supabase } from "../../supabaseClient";
import CustomAlert from "../../components/CustomAlert";
import ConfirmModal from "../../components/ConfirmModal";
import { useTheme } from "../../components/ThemeContext";
import "./styles/EditBuildingUser.css";

const TABLE_MAP = {
  apartment: "apartments",
  office: "offices",
  garage: "garages",
  retail: "retails",
};
const TYPE_LABELS = {
  apartment: "Апартамент",
  office: "Офис",
  garage: "Гараж",
  retail: "Ритейл",
};

function EditBuildingUser() {
  const { id: userIdFromUrl } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode } = useTheme();

  const {
    buildingId,
    propertyType: initialType,
    propertyId,
    previousBuilding,
    previousPage,
    previousSearch,
    scrollPosition,
  } = location.state || {};

  const goBack = () => {
    navigate("/admin/users-building", {
      state: {
        previousBuilding,
        previousPage,
        previousSearch,
        scrollPosition,
      },
    });
  };

  const [propertyData, setPropertyData] = useState({
    id: null,
    type: initialType || "apartment",
    number: "",
    floor: "",
    area: "",
    residents: "",
    description: "",
    building_name: "",
    building_address: "",
  });

  const [selectedOwner, setSelectedOwner] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [alert, setAlert] = useState({
    show: false,
    message: "",
    type: "info",
  });
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!buildingId) {
        setFetching(false);
        return;
      }

      try {
        const typeToUse =
          location.state?.propertyType || initialType || "apartment";
        const tableName = TABLE_MAP[typeToUse] || "apartments";
        const specificPropertyId = location.state?.propertyId;

        let query = supabase
          .from(tableName)
          .select(
            `*, buildings(name, address), users(id, first_name, last_name, email)`
          );

        if (specificPropertyId) {
          query = query.eq("id", specificPropertyId);
        } else {
          query = query
            .eq("user_id", userIdFromUrl)
            .eq("building_id", buildingId)
            .limit(1);
        }

        const { data, error } = await query.maybeSingle();
        if (error) throw error;

        if (data) {
          setPropertyData({
            id: data.id,
            type: typeToUse,
            number: data.number || "",
            floor: data.floor || "",
            area: data.area || "",
            residents: data.residents || "",
            description: data.description || "",
            building_name: data.buildings?.name,
            building_address: data.buildings?.address,
          });
          if (data.users) {
            setSelectedOwner({
              value: data.users.id,
              label: `${data.users.first_name} ${data.users.last_name} (${data.users.email})`,
            });
          }
        } else {
          setAlert({
            show: true,
            message: "Имотът не е намерен.",
            type: "error",
          });
        }
      } catch (err) {
        console.error("Error:", err);
        setAlert({
          show: true,
          message: "Грешка при зареждане.",
          type: "error",
        });
      } finally {
        setFetching(false);
      }
    };
    loadData();
  }, [userIdFromUrl, buildingId, initialType, location.state]);

  const loadUsers = async (inputValue) => {
    const { data } = await supabase
      .from("users")
      .select("id, first_name, last_name, email")
      .or(
        `first_name.ilike.%${inputValue}%,last_name.ilike.%${inputValue}%,email.ilike.%${inputValue}%`
      )
      .limit(20);
    return (data || []).map((u) => ({
      value: u.id,
      label: `${u.first_name} ${u.last_name} (${u.email})`,
    }));
  };

  const handleChange = (e) => {
    setPropertyData({ ...propertyData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const tableName = TABLE_MAP[propertyData.type];
      const updates = {
        number: propertyData.number,
        floor: propertyData.floor,
        area: propertyData.area ? parseFloat(propertyData.area) : null,
        user_id: selectedOwner ? selectedOwner.value : null,
      };
      if (propertyData.type === "apartment")
        updates.residents = propertyData.residents
          ? parseInt(propertyData.residents)
          : 0;
      if (propertyData.type === "retail")
        updates.description = propertyData.description;

      const { error } = await supabase
        .from(tableName)
        .update(updates)
        .eq("id", propertyData.id);
      if (error) throw error;

      setAlert({ show: true, message: "✅ Запазено!", type: "success" });
      setTimeout(() => goBack(), 1000);
    } catch (err) {
      setAlert({
        show: true,
        message: "Грешка: " + err.message,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setShowConfirm(false);
    try {
      const tableName = TABLE_MAP[propertyData.type];
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq("id", propertyData.id);
      if (error) throw error;
      setAlert({ show: true, message: "Имотът е изтрит.", type: "success" });
      setTimeout(() => goBack(), 1000);
    } catch (err) {
      setAlert({
        show: true,
        message: "Грешка: " + err.message,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectStyles = {
    control: (base, state) => ({
      ...base,
      background: isDarkMode ? "var(--au-bg-page)" : "white",
      borderColor: state.isFocused ? "var(--au-primary)" : "var(--au-border)",
      color: "var(--au-text-main)",
      minHeight: "42px",
    }),
    menu: (base) => ({
      ...base,
      background: isDarkMode ? "#1e293b" : "white",
      zIndex: 999,
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
  };

  if (fetching)
    return (
      <div
        className="loading-text"
        style={{ padding: "2rem", textAlign: "center" }}
      >
        Зареждане данни за имота...
      </div>
    );

  return (
    <div className={`ebu-container ${isDarkMode ? "au-dark" : "au-light"}`}>
      <div className="ebu-header">
        <div>
          <h1>Редакция на Имот</h1>
          <p>Промяна на собственост и параметри</p>
        </div>
        <button className="ebu-btn ebu-btn-secondary" onClick={goBack}>
          Назад
        </button>
      </div>

      <div className="ebu-grid">
        <div className="ebu-card">
          <div className="ebu-card-title">📝 Данни за имота</div>
          <div className="ebu-form-group">
            <label>Собственик / Живущ</label>
            <AsyncSelect
              cacheOptions
              defaultOptions
              loadOptions={loadUsers}
              value={selectedOwner}
              onChange={setSelectedOwner}
              styles={selectStyles}
              placeholder="Търси собственик..."
              noOptionsMessage={() => "Няма намерени"}
            />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
            }}
          >
            <div className="ebu-form-group">
              <label>Номер (№)</label>
              <input
                name="number"
                className="ebu-input"
                value={propertyData.number}
                onChange={handleChange}
              />
            </div>
            <div className="ebu-form-group">
              <label>Етаж</label>
              <input
                name="floor"
                className="ebu-input"
                value={propertyData.floor}
                onChange={handleChange}
              />
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
            }}
          >
            <div className="ebu-form-group">
              <label>Площ (m²)</label>
              <input
                name="area"
                type="number"
                className="ebu-input"
                value={propertyData.area}
                onChange={handleChange}
              />
            </div>
            {propertyData.type === "apartment" && (
              <div className="ebu-form-group">
                <label>Брой Живущи</label>
                <input
                  name="residents"
                  type="number"
                  className="ebu-input"
                  value={propertyData.residents}
                  onChange={handleChange}
                />
              </div>
            )}
          </div>
          {propertyData.type === "retail" && (
            <div className="ebu-form-group">
              <label>Описание / Дейност</label>
              <input
                name="description"
                className="ebu-input"
                value={propertyData.description}
                onChange={handleChange}
              />
            </div>
          )}
          <div className="ebu-actions">
            <button
              className="ebu-btn ebu-btn-danger"
              onClick={() => setShowConfirm(true)}
              disabled={loading}
            >
              🗑️ Изтрий имота
            </button>
            <button
              className="ebu-btn ebu-btn-primary"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? "Запазване..." : "Запази промените"}
            </button>
          </div>
        </div>

        <div className="ebu-card" style={{ height: "fit-content" }}>
          <div className="ebu-card-title">🏢 Инфо за сградата</div>
          <div className="ebu-form-group">
            <label>Сграда</label>
            <div style={{ fontWeight: 600 }}>
              {propertyData.building_name || "-"}
            </div>
            <div style={{ fontSize: "0.9rem", color: "var(--au-text-sec)" }}>
              {propertyData.building_address}
            </div>
          </div>
          <hr
            style={{
              width: "100%",
              borderTop: "1px dashed var(--au-border)",
              margin: "1rem 0",
            }}
          />
          <div className="ebu-form-group">
            <label>Тип Обект</label>
            <div
              className="au-badge"
              style={{
                display: "inline-block",
                textAlign: "center",
                background:
                  propertyData.type === "apartment" ? "#dbeafe" : "#f3f4f6",
                color:
                  propertyData.type === "apartment" ? "#1e40af" : "#374151",
              }}
            >
              {TYPE_LABELS[propertyData.type] || propertyData.type}
            </div>
          </div>
        </div>
      </div>

      <CustomAlert
        message={alert.message}
        type={alert.type}
        onClose={() => setAlert({ ...alert, show: false })}
        visible={alert.show}
      />
      {showConfirm && (
        <ConfirmModal
          title="Изтриване на имот"
          message="Сигурни ли сте, че искате да премахнете този имот от сградата?"
          onConfirm={handleDelete}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}

export default EditBuildingUser;
