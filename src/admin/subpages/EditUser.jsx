import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import AsyncSelect from "react-select/async";
import { supabase } from "../../supabaseClient";
import CustomAlert from "../../components/CustomAlert";
import ConfirmModal from "../../components/ConfirmModal";
import "./styles/EditUser.css";

function EditUser() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { buildingId, propertyType, propertyNumber } = location.state || {};

  const [firstName, setFirstName] = useState("");
  const [secondName, setSecondName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("user");
  const [buildings, setBuildings] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [floor, setFloor] = useState("");
  const [apartmentNumber, setApartmentNumber] = useState("");
  const [residents, setResidents] = useState("");
  const [garageNumber, setGarageNumber] = useState("");
  const [officeNumber, setOfficeNumber] = useState("");
  const [officeArea, setOfficeArea] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("info");
  const [showConfirm, setShowConfirm] = useState(false);

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

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: buildingsData, error: buildingsError } = await supabase
          .from("buildings")
          .select("*");
        if (buildingsError) throw buildingsError;
        setBuildings(buildingsData);

        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("*, apartments(*), garages(*), offices(*)")
          .eq("id", id)
          .single();
        if (userError) throw userError;

        setFirstName(userData.first_name);
        setSecondName(userData.second_name || "");
        setLastName(userData.last_name);
        setPhone(userData.phone || "");
        setRole(userData.role);

        const resolveBuildingSelect = (bId) => {
          const buildingObj = (buildingsData || []).find((b) => b.id === bId);
          if (buildingObj) {
            setSelectedBuilding({
              value: buildingObj.id,
              label: `${buildingObj.name}, ${buildingObj.address}`,
            });
          }
        };

        const apt = (userData.apartments || []).find(
          (a) =>
            a.building_id === buildingId &&
            (!propertyType || propertyType === "apartment") &&
            (!propertyNumber || a.number?.toString().trim() === propertyNumber)
        );
        if (apt) {
          setFloor(apt.floor || "");
          setApartmentNumber(apt.number || "");
          setResidents(apt.residents || "");
          setOfficeArea(apt.area ?? "");
          resolveBuildingSelect(apt.building_id);
        }

        const garage = (userData.garages || []).find(
          (g) => g.building_id === buildingId
        );
        if (garage) {
          setGarageNumber(garage.number || "");
          if (!apt) resolveBuildingSelect(garage.building_id);
        }

        const office = (userData.offices || []).find(
          (o) =>
            o.building_id === buildingId &&
            (!propertyType || propertyType === "office") &&
            (!propertyNumber || o.number?.toString().trim() === propertyNumber)
        );
        if (office) {
          setOfficeNumber(office.number || "");
          setOfficeArea(office.area ?? "");
          setFloor(office.floor || "");
          if (!apt && !garage) resolveBuildingSelect(office.building_id);
        }

        if (
          !apt &&
          !garage &&
          !office &&
          (userData.apartments?.[0] ||
            userData.garages?.[0] ||
            userData.offices?.[0])
        ) {
          const any =
            userData.apartments?.[0]?.building_id ??
            userData.garages?.[0]?.building_id ??
            userData.offices?.[0]?.building_id;
          resolveBuildingSelect(any);
        }
      } catch (error) {
        console.error("Грешка при зареждане на потребителя:", error.message);
        setAlertType("error");
        setAlertMessage("Грешка при зареждане на данните: " + error.message);
      } finally {
        setIsLoadingData(false);
      }
    }

    fetchData();
  }, [id, buildingId]);

  const handleChange = (setter) => (e) => {
    setter(e.target.value);
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const handleSave = async () => {
    const newErrors = {};
    if (!firstName) newErrors.firstName = "Моля въведете първо име";
    if (!lastName) newErrors.lastName = "Моля изберете фамилия";
    if (!selectedBuilding) newErrors.selectedBuilding = "Моля изберете сграда";

    if (garageNumber) {
      if (!selectedBuilding || !selectedBuilding.value) {
        newErrors.selectedBuilding =
          "Моля изберете сграда, преди да въведете гараж.";
      } else {
        const { data: buildingInfo, error: buildingError } = await supabase
          .from("buildings")
          .select("id, name, garages")
          .eq("id", selectedBuilding.value)
          .maybeSingle();

        if (buildingError) {
          alert("Грешка при зареждане на информация за сградата.");
          console.error(buildingError);
          setErrors(newErrors);
          return;
        }

        if (
          !buildingInfo ||
          !buildingInfo.garages ||
          buildingInfo.garages === 0
        ) {
          newErrors.garageNumber = `Сградата "${
            buildingInfo?.name || ""
          }" няма налични гаражи.`;
        } else {
          const numberValue = Number(garageNumber);
          if (
            isNaN(numberValue) ||
            numberValue < 1 ||
            numberValue > buildingInfo.garages
          ) {
            newErrors.garageNumber = `Номерът на гаража трябва да е между 1 и ${buildingInfo.garages}.`;
          } else {
            const { data: takenGarage } = await supabase
              .from("garages")
              .select("id, user_id")
              .eq("building_id", selectedBuilding.value)
              .eq("number", numberValue)
              .neq("user_id", id)
              .maybeSingle();

            if (takenGarage) {
              newErrors.garageNumber = `Гараж №${numberValue} вече е зает от друг потребител.`;
            }
          }
        }
      }
    }

    if (officeNumber) {
      const officeNum = officeNumber;
      if (officeNum < 1) {
        newErrors.officeNumber =
          "Номерът на офиса трябва да е положително число.";
      }
    }

    if (officeArea !== "") {
      const areaNum = Number(officeArea);
      if (!Number.isFinite(areaNum) || areaNum <= 0) {
        newErrors.officeArea = "Площта трябва да е положително число (m²).";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      await supabase
        .from("users")
        .update({
          first_name: firstName,
          second_name: secondName,
          last_name: lastName,
          phone,
          role,
        })
        .eq("id", id);

      const selB = Number(selectedBuilding?.value);
      const bIdForQuery = Number(buildingId) || selB;
      const areaNum = officeArea === "" ? null : Number(officeArea);

      const { data: apartment } = await supabase
        .from("apartments")
        .select("*")
        .eq("user_id", id)
        .eq("building_id", bIdForQuery)
        .maybeSingle();

      if (apartment) {
        if (floor || apartmentNumber || residents) {
          await supabase
            .from("apartments")
            .update({
              building_id: selB,
              floor,
              number: apartmentNumber,
              residents,
              area: areaNum,
            })
            .eq("id", apartment.id);
        } else {
          await supabase.from("apartments").delete().eq("id", apartment.id);
        }
      } else {
        if (floor || apartmentNumber || residents) {
          await supabase.from("apartments").insert({
            user_id: id,
            building_id: selB,
            floor,
            number: apartmentNumber,
            residents,
            area: areaNum,
          });
        }
      }

      const { data: garage } = await supabase
        .from("garages")
        .select("*")
        .eq("user_id", id)
        .eq("building_id", bIdForQuery)
        .maybeSingle();

      if (garage) {
        if (garageNumber) {
          await supabase
            .from("garages")
            .update({
              building_id: selB,
              number: garageNumber,
            })
            .eq("id", garage.id);
        } else {
          await supabase.from("garages").delete().eq("id", garage.id);
        }
      } else {
        if (garageNumber) {
          await supabase.from("garages").insert({
            user_id: id,
            building_id: selB,
            number: garageNumber,
          });
        }
      }

      const { data: office } = await supabase
        .from("offices")
        .select("*")
        .eq("user_id", id)
        .eq("building_id", bIdForQuery)
        .eq("number", propertyNumber || officeNumber)
        .maybeSingle();

      if (office) {
        if (officeNumber) {
          await supabase
            .from("offices")
            .update({
              building_id: selB,
              number: officeNumber,
              area: areaNum,
            })
            .eq("id", office.id);
        } else {
          await supabase.from("offices").delete().eq("id", office.id);
        }
      } else {
        if (officeNumber) {
          await supabase.from("offices").insert({
            user_id: id,
            building_id: selB,
            number: officeNumber,
            area: areaNum,
          });
        }
      }

      setAlertType("success");
      setAlertMessage("Промените са запазени успешно!");
      setTimeout(() => navigate("/admin/users"), 2500);
    } catch (error) {
      console.error("Грешка при обновяване:", error.message);
      setAlertType("error");
      setAlertMessage("Грешка при запазване: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirmed = async () => {
    setLoading(true);
    const selB = Number(selectedBuilding?.value || buildingId);

    try {
      if (propertyType === "apartment") {
        await supabase
          .from("apartments")
          .delete()
          .eq("user_id", id)
          .eq("building_id", selB)
          .eq("number", propertyNumber);
      } else if (propertyType === "office") {
        await supabase
          .from("offices")
          .delete()
          .eq("user_id", id)
          .eq("building_id", selB)
          .eq("number", propertyNumber);
      } else if (propertyType === "garage") {
        await supabase
          .from("garages")
          .delete()
          .eq("user_id", id)
          .eq("building_id", selB)
          .eq("number", propertyNumber);
      } else {
        console.warn(
          "Не е подаден propertyType – няма конкретен имот за изтриване."
        );
      }

      const { data: remainingApartments } = await supabase
        .from("apartments")
        .select("id")
        .eq("user_id", id);

      const { data: remainingGarages } = await supabase
        .from("garages")
        .select("id")
        .eq("user_id", id);

      const { data: remainingOffices } = await supabase
        .from("offices")
        .select("id")
        .eq("user_id", id);

      if (
        (remainingApartments?.length ?? 0) === 0 &&
        (remainingGarages?.length ?? 0) === 0 &&
        (remainingOffices?.length ?? 0) === 0
      ) {
        await supabase.from("users").delete().eq("id", id);
        setAlertType("success");
        setAlertMessage("Потребителят е изтрит напълно (нямаше други имоти).");
      } else {
        setAlertType("success");
        setAlertMessage("Записът за имота е изтрит успешно.");
      }

      setTimeout(() => navigate("/admin/users"), 2500);
    } catch (error) {
      console.error("Грешка при изтриване:", error.message);
      setAlertType("error");
      setAlertMessage("Грешка при изтриване: " + error.message);
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  if (isLoadingData) {
    return <div className="loading-text">Зареждане на данните...</div>;
  }

  return (
    <div className="edit-user-container">
      <h1 className="edit-page-title">Редакция на потребител</h1>
      <div className="edit-user-form">
        <div className="edit-form-grid">
          <div
            className={`edit-form-group ${errors.firstName ? "has-error" : ""}`}
          >
            <label>Първо име *</label>
            <input
              name="firstName"
              value={firstName}
              onChange={handleChange(setFirstName)}
            />
            {errors.firstName && (
              <span className="error-message">{errors.firstName}</span>
            )}
          </div>

          <div className="edit-form-group">
            <label>Презиме</label>
            <input
              name="secondName"
              value={secondName}
              onChange={handleChange(setSecondName)}
            />
          </div>

          <div
            className={`edit-form-group ${errors.lastName ? "has-error" : ""}`}
          >
            <label>Фамилия *</label>
            <input
              name="lastName"
              value={lastName}
              onChange={handleChange(setLastName)}
            />
            {errors.lastName && (
              <span className="error-message">{errors.lastName}</span>
            )}
          </div>

          <div className="edit-form-group">
            <label>Телефон</label>
            <input
              name="phone"
              value={phone}
              onChange={handleChange(setPhone)}
            />
          </div>

          <div className="edit-form-group">
            <label>Роля</label>
            <select name="role" value={role} onChange={handleChange(setRole)}>
              <option value="user">Потребител</option>
              <option value="admin">Администратор</option>
            </select>
          </div>

          <div
            className={`edit-form-group ${
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
              value={selectedBuilding}
              onChange={(option) => setSelectedBuilding(option)}
              placeholder="Търсене на сграда..."
              isClearable
            />
            {errors.selectedBuilding && (
              <span className="error-message">{errors.selectedBuilding}</span>
            )}
          </div>

          <div className="edit-form-group">
            <label>Етаж</label>
            <input
              name="floor"
              value={floor}
              onChange={handleChange(setFloor)}
            />
            {errors.floor && (
              <span className="error-message">{errors.floor}</span>
            )}
          </div>

          <div className="edit-form-group">
            <label>Апартамент</label>
            <input
              name="apartmentNumber"
              value={apartmentNumber}
              onChange={handleChange(setApartmentNumber)}
            />
            {errors.apartmentNumber && (
              <span className="error-message">{errors.apartmentNumber}</span>
            )}
          </div>

          <div className="edit-form-group">
            <label>Живущи</label>
            <input
              name="residents"
              value={residents}
              onChange={handleChange(setResidents)}
            />
          </div>

          <div className="edit-form-group">
            <label>Гараж</label>
            <input
              name="garageNumber"
              value={garageNumber}
              onChange={handleChange(setGarageNumber)}
            />
            {errors.garageNumber && (
              <span className="error-message">{errors.garageNumber}</span>
            )}
          </div>

          <div className="edit-form-group">
            <label>Офис №</label>
            <input
              name="officeNumber"
              value={officeNumber}
              onChange={handleChange(setOfficeNumber)}
            />
            {errors.officeNumber && (
              <span className="error-message">{errors.officeNumber}</span>
            )}
          </div>
          <div className="edit-form-group">
            <label>Площ (m²)</label>
            <input
              name="officeArea"
              value={officeArea}
              onChange={handleChange(setOfficeArea)}
            />
            {errors.officeArea && (
              <span className="error-message">{errors.officeArea}</span>
            )}
          </div>
        </div>

        <div className="edit-form-actions">
          <button
            className="edit-primary-button"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Запазване..." : "Запази промените"}
          </button>
          <button
            className="edit-secondary-button"
            onClick={() => navigate("/admin/users")}
            disabled={loading}
          >
            Отказ
          </button>
          <button
            className="edit-danger-button"
            onClick={() => setShowConfirm(true)}
            disabled={loading}
          >
            Изтрий потребител
          </button>
        </div>
      </div>
      <CustomAlert
        message={alertMessage}
        type={alertType}
        onClose={() => setAlertMessage("")}
      />

      {showConfirm && (
        <ConfirmModal
          title="Изтриване на потребител"
          message="Сигурни ли сте, че искате да изтриете този потребител?"
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}

export default EditUser;
