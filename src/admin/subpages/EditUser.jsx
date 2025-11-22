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
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");
  const [buildings, setBuildings] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [floor, setFloor] = useState("");
  const [apartmentNumber, setApartmentNumber] = useState("");
  const [residents, setResidents] = useState("");
  const [garageNumber, setGarageNumber] = useState("");
  const [officeNumber, setOfficeNumber] = useState("");
  const [officeArea, setOfficeArea] = useState("");
  const [retailDescription, setRetailDescription] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);

  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("info");
  const [showConfirm, setShowConfirm] = useState(false);

  const isGarage = propertyType === "garage";
  const isOffice = propertyType === "office";
  const isApartment = propertyType === "apartment";

  const loadBuildings = async (inputValue) => {
    const { data, error } = await supabase
      .from("buildings")
      .select("id, name, address")
      .ilike("name", `%${inputValue}%`)
      .limit(10);

    if (error) {
      console.error("Грешка при зареждане на сгради:", error);
      return [];
    }

    return (data || []).map((b) => ({
      value: b.id,
      label: `${b.name}, ${b.address}`,
    }));
  };

  const loadUsers = async (inputValue) => {
    const { data, error } = await supabase
      .from("users")
      .select("id, first_name, second_name, last_name, email")
      .or(`first_name.ilike.%${inputValue}%,last_name.ilike.%${inputValue}%`)
      .limit(20);

    if (error) {
      console.error("Грешка при зареждане на потребители:", error);
      return [];
    }

    let options = data.map((u) => ({
      value: u.id,
      label:
        `${u.first_name ?? ""} ${u.second_name ?? ""} ${
          u.last_name ?? ""
        }`.trim() || u.email,
    }));

    if (selectedUser) {
      const exists = options.some((o) => o.value === selectedUser.value);
      if (!exists) {
        options = [selectedUser, ...options];
      } else {
        options = [
          ...options.filter((o) => o.value === selectedUser.value),
          ...options.filter((o) => o.value !== selectedUser.value),
        ];
      }
    }

    return options;
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
          .select("*, apartments(*), garages(*), offices(*), retails(*)")
          .eq("id", id)
          .single();
        if (userError) throw userError;

        setFirstName(userData.first_name);
        setSecondName(userData.second_name || "");
        setLastName(userData.last_name);
        setSelectedUser({
          value: userData.id,
          label:
            `${userData.first_name ?? ""} ${userData.second_name ?? ""} ${
              userData.last_name ?? ""
            }`.trim() || userData.email,
        });

        setPhone(userData.phone || "");
        setEmail(userData.email || "");
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
          (g) =>
            g.building_id === buildingId &&
            (!propertyType || propertyType === "garage") &&
            (!propertyNumber || g.number?.toString().trim() === propertyNumber)
        );

        if (garage) {
          setGarageNumber(garage.number || "");
          setFloor(garage.floor || "");
          setOfficeArea(garage.area ?? "");
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

        const retail = (userData.retails || []).find(
          (r) =>
            r.building_id === buildingId &&
            (!propertyType || propertyType === "retail") &&
            (!propertyNumber || r.number?.toString().trim() === propertyNumber)
        );

        if (retail) {
          setOfficeNumber(retail.number || "");
          setOfficeArea(retail.area ?? "");
          setFloor(retail.floor || "");
          setRetailDescription(retail.description || "");
          if (!apt && !garage && !office)
            resolveBuildingSelect(retail.building_id);
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
  }, [id, buildingId, propertyType, propertyNumber]);

  const handleChange = (setter) => (e) => {
    setter(e.target.value);
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const clean = (val) => (val === "" ? null : val);

  const handleSave = async () => {
    setLoading(true);

    try {
      if (!selectedUser || selectedUser.value === id) {
        await supabase
          .from("users")
          .update({
            first_name: firstName,
            second_name: secondName,
            last_name: lastName,
            phone,
            email,
            role,
          })
          .eq("id", id);
      }

      const selB = Number(selectedBuilding?.value);
      const areaNum = clean(officeArea);
      const floorNum = clean(floor);
      const newOwnerId = selectedUser?.value || id;

      if (propertyType === "apartment") {
        await supabase
          .from("apartments")
          .update(
            {
              user_id: newOwnerId,
              building_id: selB,
              floor: floorNum,
              number: clean(apartmentNumber),
              residents: clean(residents),
              area: areaNum,
            },
            { returning: "minimal" }
          )
          .eq("building_id", selB)
          .eq("number", propertyNumber);
      }

      if (propertyType === "garage") {
        await supabase
          .from("garages")
          .update(
            {
              user_id: newOwnerId,
              building_id: selB,
              number: clean(garageNumber),
              floor: floorNum,
              area: areaNum,
            },
            { returning: "minimal" }
          )
          .eq("building_id", selB)
          .eq("number", propertyNumber);
      }

      if (propertyType === "office") {
        await supabase
          .from("offices")
          .update(
            {
              user_id: newOwnerId,
              building_id: selB,
              number: clean(officeNumber),
              area: areaNum,
              floor: floorNum,
            },
            { returning: "minimal" }
          )
          .eq("building_id", selB)
          .eq("number", propertyNumber);
      }

      if (propertyType === "retail") {
        await supabase
          .from("retails")
          .update(
            {
              user_id: newOwnerId,
              building_id: selB,
              number: clean(officeNumber),
              area: areaNum,
              floor: floorNum,
              description: clean(retailDescription),
            },
            { returning: "minimal" }
          )
          .eq("building_id", selB)
          .eq("number", propertyNumber);
      }

      setAlertType("success");
      setAlertMessage("✅ Промените са запазени успешно!");
      setTimeout(() => {
        navigate("/admin/users", {
          state: {
            previousBuilding: selectedBuilding,
            previousSearch: location.state?.searchTerm || "",
            previousPage: location.state?.currentPage || 1,
            scrollPosition: location.state?.scrollPosition || 0,
          },
        });
      }, 2000);
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
          .eq("user_id", selectedUser?.value || id)
          .eq("building_id", selB)
          .eq("number", propertyNumber);
      } else if (propertyType === "office") {
        await supabase
          .from("offices")
          .delete()
          .eq("user_id", selectedUser?.value || id)
          .eq("building_id", selB)
          .eq("number", propertyNumber);
      } else if (propertyType === "garage") {
        await supabase
          .from("garages")
          .delete()
          .eq("user_id", selectedUser?.value || id)
          .eq("building_id", selB)
          .eq("number", propertyNumber);
      } else if (propertyType === "retail") {
        await supabase
          .from("retails")
          .delete()
          .eq("user_id", selectedUser?.value || id)
          .eq("building_id", selB)
          .eq("number", propertyNumber);
      } else {
        console.warn(
          "Не е подаден propertyType – няма конкретен имот за изтриване."
        );
      }

      setAlertType("success");
      setAlertMessage("Записът за имота е изтрит успешно.");

      setTimeout(() => {
        navigate("/admin/users", {
          state: {
            previousBuilding: selectedBuilding,
            previousSearch: location.state?.searchTerm || "",
            previousPage: location.state?.currentPage || 1,
            scrollPosition: location.state?.scrollPosition || 0,
          },
        });
      }, 3000);
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
          <div className="edit-form-group">
            <label>Избери потребител *</label>
            <AsyncSelect
              className="custom-select"
              classNamePrefix="custom"
              cacheOptions
              defaultOptions={selectedUser ? [selectedUser] : true}
              loadOptions={loadUsers}
              value={selectedUser}
              onChange={async (option) => {
                setSelectedUser(option);

                if (option?.value) {
                  const { data, error } = await supabase
                    .from("users")
                    .select("phone, email")
                    .eq("id", option.value)
                    .single();

                  if (!error) {
                    setPhone(data?.phone || "");
                    setEmail(data?.email || "");
                  }
                } else {
                  setPhone("");
                  setEmail("");
                }
              }}
              placeholder="Търсене по име"
              isClearable
            />
          </div>

          <div className="edit-form-group">
            <label>Имейл</label>
            <input
              name="email"
              type="email"
              value={email}
              onChange={handleChange(setEmail)}
            />
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

          {isApartment && (
            <>
              <div className="edit-form-group">
                <label>Етаж</label>
                <input
                  name="floor"
                  value={floor}
                  onChange={handleChange(setFloor)}
                />
              </div>

              <div className="edit-form-group">
                <label>Апартамент №</label>
                <input
                  name="apartmentNumber"
                  value={apartmentNumber}
                  onChange={handleChange(setApartmentNumber)}
                />
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
                <label>Площ (m²)</label>
                <input
                  name="officeArea"
                  value={officeArea}
                  onChange={handleChange(setOfficeArea)}
                />
              </div>
            </>
          )}

          {isOffice && (
            <>
              <div className="edit-form-group">
                <label>Етаж</label>
                <input
                  name="floor"
                  value={floor}
                  onChange={handleChange(setFloor)}
                />
              </div>

              <div className="edit-form-group">
                <label>Офис №</label>
                <input
                  name="officeNumber"
                  value={officeNumber}
                  onChange={handleChange(setOfficeNumber)}
                />
              </div>

              <div className="edit-form-group">
                <label>Площ (m²)</label>
                <input
                  name="officeArea"
                  value={officeArea}
                  onChange={handleChange(setOfficeArea)}
                />
              </div>
            </>
          )}
          {isGarage && (
            <>
              <div className="edit-form-group">
                <label>Номер на гараж</label>
                <input
                  name="garageNumber"
                  value={garageNumber}
                  onChange={handleChange(setGarageNumber)}
                />
              </div>

              <div className="edit-form-group">
                <label>Етаж</label>
                <input
                  name="floor"
                  value={floor}
                  onChange={handleChange(setFloor)}
                />
              </div>

              <div className="edit-form-group">
                <label>Площ (m²)</label>
                <input
                  name="officeArea"
                  value={officeArea}
                  onChange={handleChange(setOfficeArea)}
                />
              </div>
            </>
          )}

          {propertyType === "retail" && (
            <>
              <div className="edit-form-group">
                <label>Етаж</label>
                <input
                  name="floor"
                  value={floor}
                  onChange={handleChange(setFloor)}
                />
              </div>

              <div className="edit-form-group">
                <label>Ритейл №</label>
                <input
                  name="officeNumber"
                  value={officeNumber}
                  onChange={handleChange(setOfficeNumber)}
                />
              </div>

              <div className="edit-form-group">
                <label>Площ (m²)</label>
                <input
                  name="officeArea"
                  value={officeArea}
                  onChange={handleChange(setOfficeArea)}
                />
              </div>
              <div className="edit-form-group">
                <label>Описание</label>
                <input
                  name="retailDescription"
                  value={retailDescription}
                  onChange={handleChange(setRetailDescription)}
                />
              </div>
            </>
          )}
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
            onClick={() =>
              navigate("/admin/users", {
                state: {
                  previousBuilding: selectedBuilding,
                  previousSearch: location.state?.searchTerm || "",
                  previousPage: location.state?.currentPage || 1,
                  scrollPosition: location.state?.scrollPosition || 0,
                },
              })
            }
            disabled={loading}
          >
            Отказ
          </button>

          <button
            className="edit-danger-button"
            onClick={() => setShowConfirm(true)}
            disabled={loading}
          >
            Изтрий записа
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
          title="Изтриване на запис"
          message="Сигурни ли сте, че искате да изтриете този запис?"
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}

export default EditUser;
