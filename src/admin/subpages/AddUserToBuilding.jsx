import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AsyncSelect from "react-select/async";
import Select from "react-select";
import Swal from "sweetalert2";
import { supabase } from "../../supabaseClient";
import { useTheme } from "../../components/ThemeContext";
import { useUserBuildings } from "../hooks/UseUserBuildings";
import { useLocalUser } from "../hooks/UseLocalUser";

import "./styles/AddUserToBuilding.css";

const debouncePromise = (func, delay) => {
  let timer;
  return (...args) => {
    return new Promise((resolve) => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        const result = await func(...args);
        resolve(result);
      }, delay);
    });
  };
};

function AddUserToBuilding() {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  const { user: currentUser } = useLocalUser();

  const { buildings, loading: loadingBuildings } = useUserBuildings(
    currentUser?.id
  );

  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedBuilding, setSelectedBuilding] = useState(null);

  const [floor, setFloor] = useState("");
  const [apartmentNumber, setApartmentNumber] = useState("");
  const [residents, setResidents] = useState("");
  const [garageNumber, setGarageNumber] = useState("");
  const [officeNumber, setOfficeNumber] = useState("");
  const [area, setArea] = useState("");

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [selectedType, setSelectedType] = useState("apartment");

  const buildingOptions = useMemo(() => {
    return buildings.map((b) => ({
      value: b.id,
      label: `${b.name}, ${b.address}`,
    }));
  }, [buildings]);

  const fetchUsers = async (inputValue) => {
    if (!inputValue || inputValue.length < 2) return [];

    const { data } = await supabase
      .from("users")
      .select("id, first_name, second_name, last_name, email")
      .or(
        `first_name.ilike.%${inputValue}%,last_name.ilike.%${inputValue}%,email.ilike.%${inputValue}%`
      )
      .limit(20);

    return (data || []).map((u) => ({
      value: u.id,
      label: `${u.first_name} ${u.second_name || ""} ${u.last_name} (${
        u.email
      })`.trim(),
    }));
  };

  const loadUsersDebounced = useCallback(debouncePromise(fetchUsers, 1000), []);

  const selectStyles = {
    control: (base, state) => ({
      ...base,
      background: isDarkMode ? "var(--au-bg-page)" : "white",
      borderColor: state.isFocused ? "var(--au-primary)" : "var(--au-border)",
      color: "var(--au-text-main)",
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

  const handleSave = async () => {
    const newErrors = {};
    if (!selectedUser) newErrors.selectedUser = "Изберете потребител";
    if (!selectedBuilding) newErrors.selectedBuilding = "Изберете сграда";

    const areaNum = area !== "" ? parseFloat(area) : null;
    const floorNum = floor !== "" ? parseInt(floor) : null;
    const residentsNum = residents !== "" ? parseInt(residents) : 0;

    if (area && (isNaN(areaNum) || areaNum <= 0)) {
      newErrors.area = "Площта трябва да е положително число.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const userId = selectedUser.value;
      const buildingId = selectedBuilding.value;

      let error = null;
      const commonData = {
        user_id: userId,
        building_id: buildingId,
        floor: floorNum,
        area: areaNum,
      };

      if (selectedType === "apartment") {
        const { error: err } = await supabase.from("apartments").insert([
          {
            ...commonData,
            number: apartmentNumber,
            residents: residentsNum,
          },
        ]);
        error = err;
      } else if (selectedType === "garage") {
        const { error: err } = await supabase.from("garages").insert([
          {
            ...commonData,
            number: garageNumber,
          },
        ]);
        error = err;
      } else if (selectedType === "office") {
        const { error: err } = await supabase.from("offices").insert([
          {
            ...commonData,
            number: officeNumber,
          },
        ]);
        error = err;
      }

      if (error) throw error;

      await Swal.fire({
        title: "Успех!",
        text: "Потребителят е добавен към сградата успешно.",
        icon: "success",
        confirmButtonColor: "#3b82f6",
        timer: 2000,
      });

      navigate("/admin/users-building");
    } catch (error) {
      console.error("Грешка при запис:", error.message);
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

  const goBack = () => navigate("/admin/users-building");

  return (
    <div className={`aub-container ${isDarkMode ? "au-dark" : "au-light"}`}>
      <div className="aub-header">
        <div>
          <h1>Свързване на имот</h1>
          <p>Добавяне на собственост към потребител</p>
        </div>
        <button className="aub-btn aub-btn-secondary" onClick={goBack}>
          Назад
        </button>
      </div>

      <div className="aub-card">
        <div className="aub-toggle-container">
          <button
            type="button"
            className={`aub-toggle-btn ${
              selectedType === "apartment" ? "active" : ""
            }`}
            onClick={() => setSelectedType("apartment")}
          >
            🏠 Апартамент
          </button>
          <button
            type="button"
            className={`aub-toggle-btn ${
              selectedType === "garage" ? "active" : ""
            }`}
            onClick={() => setSelectedType("garage")}
          >
            🚗 Гараж
          </button>
          <button
            type="button"
            className={`aub-toggle-btn ${
              selectedType === "office" ? "active" : ""
            }`}
            onClick={() => setSelectedType("office")}
          >
            💼 Офис
          </button>
        </div>

        <div className="aub-grid-row">
          <div className="aub-form-group">
            <label>Потребител *</label>
            <AsyncSelect
              cacheOptions
              defaultOptions
              loadOptions={loadUsersDebounced}
              onChange={setSelectedUser}
              placeholder="Търсене (мин. 2 символа)..."
              isClearable
              styles={selectStyles}
              noOptionsMessage={({ inputValue }) =>
                inputValue.length < 2
                  ? "Въведете поне 2 букви"
                  : "Няма намерени"
              }
            />
            {errors.selectedUser && (
              <span className="error-msg">{errors.selectedUser}</span>
            )}
          </div>

          <div className="aub-form-group">
            <label>Сграда *</label>
            <Select
              options={buildingOptions}
              isLoading={loadingBuildings}
              onChange={setSelectedBuilding}
              placeholder="Избери сграда..."
              isClearable
              styles={selectStyles}
              noOptionsMessage={() => "Няма сгради"}
              isSearchable={true}
            />
            {errors.selectedBuilding && (
              <span className="error-msg">{errors.selectedBuilding}</span>
            )}
          </div>
        </div>

        <hr
          style={{
            borderTop: "1px dashed var(--au-border)",
            width: "100%",
            margin: "0.5rem 0",
          }}
        />

        <div className="aub-grid-row">
          <div className="aub-form-group">
            <label>Етаж</label>
            <input
              className="aub-input"
              type="number"
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
            />
          </div>

          <div className="aub-form-group">
            <label>Площ (m²)</label>
            <input
              className="aub-input"
              type="number"
              value={area}
              onChange={(e) => setArea(e.target.value)}
            />
            {errors.area && <span className="error-msg">{errors.area}</span>}
          </div>
        </div>

        <div className="aub-grid-row">
          {selectedType === "apartment" && (
            <>
              <div className="aub-form-group">
                <label>Апартамент №</label>
                <input
                  className="aub-input"
                  value={apartmentNumber}
                  onChange={(e) => setApartmentNumber(e.target.value)}
                />
              </div>
              <div className="aub-form-group">
                <label>Брой Живущи</label>
                <input
                  className="aub-input"
                  type="number"
                  value={residents}
                  onChange={(e) => setResidents(e.target.value)}
                />
              </div>
            </>
          )}

          {selectedType === "garage" && (
            <div className="aub-form-group">
              <label>Номер на гараж</label>
              <input
                className="aub-input"
                value={garageNumber}
                onChange={(e) => setGarageNumber(e.target.value)}
              />
            </div>
          )}

          {selectedType === "office" && (
            <div className="aub-form-group">
              <label>Офис №</label>
              <input
                className="aub-input"
                value={officeNumber}
                onChange={(e) => setOfficeNumber(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="aub-actions">
          <button
            className="aub-btn aub-btn-secondary"
            onClick={goBack}
            disabled={loading}
          >
            Отказ
          </button>
          <button
            className="aub-btn aub-btn-primary"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Запазване..." : "Запази имота"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddUserToBuilding;
