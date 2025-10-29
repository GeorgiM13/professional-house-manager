import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AsyncSelect from "react-select/async";
import { supabase } from "../../supabaseClient";
import "./styles/AddUserToBuilding.css";

function AddUserToBuilding() {
  const navigate = useNavigate();
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [floor, setFloor] = useState("");
  const [apartmentNumber, setApartmentNumber] = useState("");
  const [residents, setResidents] = useState("");
  const [garageNumber, setGarageNumber] = useState("");
  const [officeNumber, setOfficeNumber] = useState("");
  const [area, setArea] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const loadBuildings = async (inputValue) => {
    const { data } = await supabase
      .from("buildings")
      .select("id, name, address")
      .ilike("name", `%${inputValue}%`)
      .limit(10);
    return data.map((b) => ({
      value: b.id,
      label: `${b.name}, ${b.address}`,
    }));
  };

  const loadUsers = async (inputValue) => {
    const { data } = await supabase
      .from("users")
      .select("id, first_name, second_name, last_name")
      .or(`first_name.ilike.%${inputValue}%,last_name.ilike.%${inputValue}%`)
      .limit(10);
    return data.map((u) => ({
      value: u.id,
      label: `${u.first_name} ${u.second_name || ""} ${u.last_name}`.trim(),
    }));
  };

  const handleSave = async () => {
    const newErrors = {};

    if (!selectedUser) newErrors.selectedUser = "Изберете потребител";
    if (!selectedBuilding) newErrors.selectedBuilding = "Изберете сграда";

    // ✅ Валидираме, че има или апартамент, или офис
    if (!apartmentNumber && !officeNumber) {
      newErrors.apartmentNumber = "Въведете апартамент или офис";
      newErrors.officeNumber = "Въведете апартамент или офис";
    }

    if (area !== "") {
      const areaNum = Number(area);
      if (!Number.isFinite(areaNum) || areaNum <= 0) {
        newErrors.area = "Площта трябва да е положително число (m²).";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const userId = selectedUser.value;
      const buildingId = selectedBuilding.value;
      const areaNum = area ? Number(area) : null;

      if (apartmentNumber) {
        const floorNum = floor !== "" ? Number(floor) : null;
        const residentsNum = residents !== "" ? Number(residents) : 0;
        const areaNum = area !== "" ? Number(area) : null;

        const { error } = await supabase.from("apartments").insert([
          {
            user_id: userId,
            building_id: buildingId,
            floor: floorNum,
            number: Number(apartmentNumber),
            residents: residentsNum,
            area: areaNum,
          },
        ]);

        if (error) {
          console.error("Грешка при добавяне на апартамент:", error.message);
          alert("Грешка при добавяне на апартамент: " + error.message);
          return;
        }
      }

      if (officeNumber) {
        await supabase.from("offices").insert([
          {
            user_id: userId,
            building_id: buildingId,
            floor: floor || null,
            number: Number(officeNumber),
            area: areaNum,
          },
        ]);
      }

      if (garageNumber) {
        await supabase.from("garages").insert([
          {
            user_id: userId,
            building_id: buildingId,
            number: Number(garageNumber),
          },
        ]);
      }

      navigate("/admin/users");
    } catch (error) {
      console.error("Грешка при запис:", error.message);
      alert("Възникна грешка: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-user-building-container">
      <h1>Добави потребител към сграда</h1>
      <div className="add-user-building-form">
        <div className="add-user-building-grid">
          <div className="add-user-building-form-group">
            <label>Потребител *</label>
            <AsyncSelect
              className="custom-select"
              classNamePrefix="custom"
              cacheOptions
              defaultOptions
              loadOptions={loadUsers}
              onChange={(option) => setSelectedUser(option)}
              placeholder="Търсене на потребител..."
              isClearable
            />
            {errors.selectedUser && (
              <span className="error-message">{errors.selectedUser}</span>
            )}
          </div>

          <div className="add-user-building-form-group">
            <label>Сграда *</label>
            <AsyncSelect
              className="custom-select"
              classNamePrefix="custom"
              cacheOptions
              defaultOptions
              loadOptions={loadBuildings}
              onChange={(option) => setSelectedBuilding(option)}
              placeholder="Търсене на сграда..."
              isClearable
            />
            {errors.selectedBuilding && (
              <span className="error-message">{errors.selectedBuilding}</span>
            )}
          </div>

          <div className="add-user-building-form-group">
            <label>Етаж</label>
            <input value={floor} onChange={(e) => setFloor(e.target.value)} />
          </div>

          <div className="add-user-building-form-group">
            <label>Апартамент</label>
            <input
              value={apartmentNumber}
              onChange={(e) => setApartmentNumber(e.target.value)}
            />
            {errors.apartmentNumber && (
              <span className="error-message">{errors.apartmentNumber}</span>
            )}
          </div>

          <div className="add-user-building-form-group">
            <label>Живущи</label>
            <input
              value={residents}
              onChange={(e) => setResidents(e.target.value)}
            />
          </div>

          <div className="add-user-building-form-group">
            <label>Гараж</label>
            <input
              value={garageNumber}
              onChange={(e) => setGarageNumber(e.target.value)}
            />
          </div>

          <div className="add-user-building-form-group">
            <label>Офис</label>
            <input
              value={officeNumber}
              onChange={(e) => setOfficeNumber(e.target.value)}
            />
            {errors.officeNumber && (
              <span className="error-message">{errors.officeNumber}</span>
            )}
          </div>

          <div className="add-user-building-form-group">
            <label>Площ (m²)</label>
            <input
              value={area}
              onChange={(e) => setArea(e.target.value)}
            />
            {errors.area && (
              <span className="error-message">{errors.area}</span>
            )}
          </div>

        </div>

        <div className="add-user-building-form-buttons">
          <button
            className="add-user-building-btn-primary"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Запазване..." : "Запази"}
          </button>
          <button
            className="add-user-building-btn-secondary"
            onClick={() => navigate("/admin/users")}
            disabled={loading}
          >
            Отказ
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddUserToBuilding;
