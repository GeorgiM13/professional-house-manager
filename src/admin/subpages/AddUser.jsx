import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AsyncSelect from "react-select/async";
import { supabase } from "../../supabaseClient";
import "./styles/AddUser.css";

function AddUser() {
  const [firstName, setFirstName] = useState("");
  const [secondName, setSecondName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");
  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [floor, setFloor] = useState("");
  const [apartmentNumber, setApartmentNumber] = useState("");
  const [residents, setResidents] = useState("");
  const [garageNumber, setGarageNumber] = useState("");
  const [officeNumber, setOfficeNumber] = useState("");
  const [area, setArea] = useState("");
  const [errors, setErrors] = useState({});
  const [selectedType, setSelectedType] = useState("apartment");

  const navigate = useNavigate();

  const loadBuildings = async (inputValue) => {
    const { data, error } = await supabase
      .from("buildings")
      .select("id, name, address, floors, apartments, garages")
      .ilike("name", `%${inputValue || ""}%`)
      .limit(10);

    if (error) {
      console.error("Грешка при зареждане на сгради: ", error);
      return [];
    }

    return (data || []).map((b) => ({
      value: b.id,
      label: `${b.name}, ${b.address}`,
      name: b.name,
      floors: b.floors,
      apartments: b.apartments,
      garages: b.garages,
    }));
  };

  function generateSecurePassword(length = 10) {
    const chars =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$";
    return Array.from(
      { length },
      () => chars[Math.floor(Math.random() * chars.length)]
    ).join("");
  }

  const handleSave = async () => {
    const newErrors = {};

    if (!firstName) newErrors.firstName = "Моля въведете първо име";
    if (!lastName) newErrors.lastName = "Моля въведете фамилия";
    if (!selectedBuilding) newErrors.selectedBuilding = "Моля изберете сграда";

    const floorNum = floor !== "" ? Number(floor) : null;
    const aptNum = apartmentNumber !== "" ? Number(apartmentNumber) : null;
    const garageNum = garageNumber !== "" ? Number(garageNumber) : null;
    const officeNum = officeNumber !== "" ? Number(officeNumber) : null;
    const residentsNum = residents !== "" ? Number(residents) : 0;
    const buildingId = selectedBuilding ? Number(selectedBuilding.value) : null;

    if (floor && !garageNumber) {
      const floorValue = parseInt(floor);
      if (
        isNaN(floorValue) ||
        floorValue < 1 ||
        floorValue > selectedBuilding.floors
      ) {
        newErrors.floor = `Етажът трябва да е между 1 и ${selectedBuilding.floors}`;
      }
    }

    if (
      apartmentNumber &&
      (parseInt(apartmentNumber) < 1 ||
        parseInt(apartmentNumber) > selectedBuilding.apartments)
    ) {
      newErrors.apartmentNumber = `Апартаментът трябва да е между 1 и ${selectedBuilding.apartments}`;
    }

    if (
      garageNumber &&
      (parseInt(garageNumber) < 1 ||
        parseInt(garageNumber) > selectedBuilding.garages)
    ) {
      newErrors.garageNumber = `Гаражът трябва да е между 1 и ${selectedBuilding.garages}`;
    }
    if (officeNumber && parseInt(officeNumber) < 1) {
      newErrors.officeNumber = `Номерът на офиса трябва да е положително число`;
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

    const buildingName = selectedBuilding?.name || "";
    const transliterate = (str) => {
      const map = {
        а: "a",
        б: "b",
        в: "v",
        г: "g",
        д: "d",
        е: "e",
        ж: "zh",
        з: "z",
        и: "i",
        й: "y",
        к: "k",
        л: "l",
        м: "m",
        н: "n",
        о: "o",
        п: "p",
        р: "r",
        с: "s",
        т: "t",
        у: "u",
        ф: "f",
        х: "h",
        ц: "ts",
        ч: "ch",
        ш: "sh",
        щ: "sht",
        ъ: "a",
        ь: "",
        ю: "yu",
        я: "ya",
      };
      return str
        .toLowerCase()
        .split("")
        .map((c) => map[c] || c)
        .join("");
    };

    const clean = (str) =>
      transliterate(str).replace(/[.,]/g, "").replace(/\s+/g, "_");

    const username = `${clean(firstName)}_${clean(
      selectedBuilding?.label || "building"
    )}_${apartmentNumber || garageNumber || officeNumber || "user"}`;
    const generatedEmail = `${username}@example.com`;
    const finalEmail = email || generatedEmail;
    const password = generateSecurePassword(10);
    const displayName = `${firstName} ${secondName} ${lastName}`.trim();

    const { data: authUser, error: authError } = await supabase.auth.signUp(
      { email: finalEmail, password },
      { data: { display_name: displayName } }
    );

    if (authError) {
      console.error("Грешка при създаване на Auth потребител:", authError);
      alert("Възникна грешка при създаване на акаунт: " + authError.message);
      return;
    }

    const { data: newUser, error: userError } = await supabase
      .from("users")
      .insert([
        {
          id: authUser.user.id,
          first_name: firstName,
          second_name: secondName,
          last_name: lastName,
          phone,
          role,
          username,
          email: finalEmail,
          password_hash: password,
        },
      ])
      .select()
      .single();

    if (userError) {
      console.error("Грешка при добавяне на потребител:", userError);
      return;
    }

    if (aptNum) {
      const areaNum = area ? Number(area) : null;
      const { error } = await supabase.from("apartments").insert([
        {
          user_id: newUser.id,
          floor: floorNum,
          number: aptNum,
          residents: residentsNum,
          area: areaNum,
          building_id: buildingId,
        },
      ]);
      if (error) {
        alert("Грешка при добавяне на апартамент: " + error.message);
        return;
      }
    }

    if (garageNum) {
      const floorNum = floor !== "" ? Number(floor) : null;
      const areaNum = area !== "" ? Number(area) : null;

      const { error } = await supabase.from("garages").insert([
        {
          user_id: newUser.id,
          number: garageNum,
          floor: floorNum,
          area: areaNum,
          building_id: buildingId,
        },
      ]);

      if (error) {
        alert("Грешка при добавяне на гараж: " + error.message);
        return;
      }
    }

    if (officeNum) {
      const areaNum = area ? Number(area) : null;
      const { error } = await supabase.from("offices").insert([
        {
          user_id: newUser.id,
          floor: floorNum,
          number: officeNum,
          area: areaNum,
          building_id: buildingId,
        },
      ]);
      if (error) {
        alert("Грешка при добавяне на офис: " + error.message);
        return;
      }
    }

    navigate("/admin/users");
  };

  return (
    <div className="add-user-container">
      <div className="form-header">
        <h1>Добавяне на нов потребител</h1>
        <p>Попълнете формата, за да добавите нов потребител</p>
      </div>

      <div className="user-form">
        <div className="property-type-toggle">
          <button
            type="button"
            className={selectedType === "apartment" ? "active" : ""}
            onClick={() => setSelectedType("apartment")}
          >
            Апартамент
          </button>
          <button
            type="button"
            className={selectedType === "garage" ? "active" : ""}
            onClick={() => setSelectedType("garage")}
          >
            Гараж
          </button>
          <button
            type="button"
            className={selectedType === "office" ? "active" : ""}
            onClick={() => setSelectedType("office")}
          >
            Офис
          </button>
        </div>
        <div className="form-grid">
          <div className={`form-group ${errors.firstName ? "has-error" : ""}`}>
            <label>Първо име *</label>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            {errors.firstName && (
              <span className="error-message">{errors.firstName}</span>
            )}
          </div>

          <div className="form-group">
            <label>Презиме</label>
            <input
              value={secondName}
              onChange={(e) => setSecondName(e.target.value)}
            />
          </div>

          <div className={`form-group ${errors.lastName ? "has-error" : ""}`}>
            <label>Фамилия *</label>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
            {errors.lastName && (
              <span className="error-message">{errors.lastName}</span>
            )}
          </div>

          <div className="form-group">
            <label>Имейл</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Оставете празно за автоматичен имейл"
            />
          </div>

          <div className="form-group">
            <label>Телефон</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          <div className="form-group">
            <label>Роля</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="user">Потребител</option>
              <option value="admin">Администратор</option>
            </select>
          </div>

          <div
            className={`form-group ${
              errors.selectedBuilding ? "has-error" : ""
            }`}
          >
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

          {selectedType === "apartment" && (
            <>
              <div className="form-group">
                <label>Етаж</label>
                <input
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Апартамент №</label>
                <input
                  value={apartmentNumber}
                  onChange={(e) => setApartmentNumber(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Живущи</label>
                <input
                  value={residents}
                  onChange={(e) => setResidents(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Площ (m²)</label>
                <input value={area} onChange={(e) => setArea(e.target.value)} />
              </div>
            </>
          )}
          {selectedType === "garage" && (
            <>
              <div className="form-group">
                <label>Етаж</label>
                <input
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Номер на гараж</label>
                <input
                  value={garageNumber}
                  onChange={(e) => setGarageNumber(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Площ (m²)</label>
                <input value={area} onChange={(e) => setArea(e.target.value)} />
              </div>
            </>
          )}
          {selectedType === "office" && (
            <>
              <div className="form-group">
                <label>Етаж</label>
                <input
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Офис №</label>
                <input
                  value={officeNumber}
                  onChange={(e) => setOfficeNumber(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Площ (m²)</label>
                <input value={area} onChange={(e) => setArea(e.target.value)} />
              </div>
            </>
          )}
        </div>

        <div className="form-actions">
          <button className="primary-button" onClick={handleSave}>
            Запази
          </button>
          <button
            className="secondary-button"
            onClick={() => navigate("/admin/users")}
          >
            Отказ
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddUser;
