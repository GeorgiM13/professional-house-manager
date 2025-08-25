import { useState, useEffect } from "react"
import { useNavigate, useParams, useLocation } from "react-router-dom"
import AsyncSelect from "react-select/async"
import { supabase } from "../../supabaseClient"
import "./styles/EditUser.css"

function EditUser() {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();
    const { buildingId } = location.state || {};

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
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);

    const loadBuildings = async (inputValue) => {
        const { data } = await supabase
            .from("buildings")
            .select("id, name, address")
            .ilike("name", `%${inputValue}%`)
            .limit(10);
        return data.map(b => ({
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
                    .select("*, apartments(*), garages(*)")
                    .eq("id", id)
                    .single();
                if (userError) throw userError;

                setFirstName(userData.first_name);
                setSecondName(userData.second_name || "");
                setLastName(userData.last_name);
                setPhone(userData.phone || "");
                setRole(userData.role);

                const apt = userData.apartments.find(a => a.building_id === buildingId);
                if (apt) {
                    setFloor(apt.floor || "");
                    setApartmentNumber(apt.number || "");
                    setResidents(apt.residents || "");

                    const buildingObj = buildingsData.find(b => b.id === apt.building_id);
                    if (buildingObj) {
                        setSelectedBuilding({
                            value: buildingObj.id,
                            label: `${buildingObj.name}, ${buildingObj.address}`
                        });
                    }
                }

                const garage = userData.garages.find(g => g.building_id === buildingId);
                if (garage) {
                    setGarageNumber(garage.number || "");

                    if (!selectedBuilding) {
                        const buildingObj = buildingsData.find(b => b.id === garage.building_id);
                        if (buildingObj) {
                            setSelectedBuilding({
                                value: buildingObj.id,
                                label: `${buildingObj.name}, ${buildingObj.address}`
                            });
                        }
                    }
                }
            } catch (error) {
                console.error("Грешка при зареждане на потребителя:", error.message);
                alert("Грешка при зареждане на данни");
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

            const { data: apartment } = await supabase
                .from("apartments")
                .select("*")
                .eq("user_id", id)
                .eq("building_id", buildingId)
                .maybeSingle();

            if (apartment) {
                if (floor || apartmentNumber || residents) {
                    await supabase
                        .from("apartments")
                        .update({
                            building_id: selectedBuilding.value,
                            floor,
                            number: apartmentNumber,
                            residents,
                        })
                        .eq("id", apartment.id);
                } else {
                    await supabase
                        .from("apartments")
                        .delete()
                        .eq("id", apartment.id);
                }
            } else {
                if (floor || apartmentNumber || residents) {
                    await supabase
                        .from("apartments")
                        .insert({
                            user_id: id,
                            building_id: selectedBuilding.value,
                            floor,
                            number: apartmentNumber,
                            residents,
                        });
                }
            }

            const { data: garage } = await supabase
                .from("garages")
                .select("*")
                .eq("user_id", id)
                .eq("building_id", buildingId)
                .maybeSingle();

            if (garage) {
                if (garageNumber) {
                    await supabase
                        .from("garages")
                        .update({
                            building_id: selectedBuilding.value,
                            number: garageNumber
                        })
                        .eq("id", garage.id);
                } else {
                    await supabase
                        .from("garages")
                        .delete()
                        .eq("id", garage.id);
                }
            } else {
                if (garageNumber) {
                    await supabase
                        .from("garages")
                        .insert({
                            user_id: id,
                            building_id: selectedBuilding.value,
                            number: garageNumber
                        });
                }
            }

            navigate("/admin/users");
        } catch (error) {
            console.error("Грешка при обновяване:", error.message);
            alert("Възникна грешка: " + error.message);
        } finally {
            setLoading(false);
        }
    };


    const handleDelete = async () => {
        if (!window.confirm("Сигурни ли сте, че искате да изтриете този потребител?")) return;

        setLoading(true);

        try {
            const { data: apartmentsInBuilding } = await supabase
                .from("apartments")
                .select("*")
                .eq("user_id", id)
                .eq("building_id", selectedBuilding.value);

            const { data: garagesInBuilding } = await supabase
                .from("garages")
                .select("*")
                .eq("user_id", id)
                .eq("building_id", selectedBuilding.value);

            if (apartmentsInBuilding?.length > 0) {
                await supabase
                    .from("apartments")
                    .delete()
                    .eq("user_id", id)
                    .eq("building_id", selectedBuilding.value);
            }

            if (garagesInBuilding?.length > 0) {
                await supabase
                    .from("garages")
                    .delete()
                    .eq("user_id", id)
                    .eq("building_id", selectedBuilding.value);
            }

            const { data: remainingApartments } = await supabase
                .from("apartments")
                .select("*")
                .eq("user_id", id);

            const { data: remainingGarages } = await supabase
                .from("garages")
                .select("*")
                .eq("user_id", id);

            if ((remainingApartments?.length === 0) && (remainingGarages?.length === 0)) {
                await supabase.from("users").delete().eq("id", id);
                alert("Потребителят е изтрит напълно.");
            } else {
                alert("Потребителят има данни в други сгради и не може да бъде изтрит напълно.");
            }

            navigate("/admin/users");
        } catch (error) {
            console.error("Грешка при изтриване:", error.message);
            alert("Възникна грешка: " + error.message);
        } finally {
            setLoading(false);
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
                    <div className={`edit-form-group ${errors.firstName ? 'has-error' : ''}`}>
                        <label>Първо име *</label>
                        <input name="firstName" value={firstName} onChange={handleChange(setFirstName)} />
                        {errors.firstName && <span className="error-message">{errors.firstName}</span>}
                    </div>

                    <div className="edit-form-group">
                        <label>Презиме</label>
                        <input name="secondName" value={secondName} onChange={handleChange(setSecondName)} />
                    </div>

                    <div className={`edit-form-group ${errors.lastName ? 'has-error' : ''}`}>
                        <label>Фамилия *</label>
                        <input name="lastName" value={lastName} onChange={handleChange(setLastName)} />
                        {errors.lastName && <span className="error-message">{errors.lastName}</span>}
                    </div>

                    <div className="edit-form-group">
                        <label>Телефон</label>
                        <input name="phone" value={phone} onChange={handleChange(setPhone)} />
                    </div>

                    <div className="edit-form-group">
                        <label>Роля</label>
                        <select name="role" value={role} onChange={handleChange(setRole)}>
                            <option value="user">Потребител</option>
                            <option value="admin">Администратор</option>
                        </select>
                    </div>

                    <div className={`edit-form-group ${errors.selectedBuilding ? 'has-error' : ''}`}>
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
                        {errors.selectedBuilding && <span className="error-message">{errors.selectedBuilding}</span>}
                    </div>

                    <div className="edit-form-group">
                        <label>Етаж</label>
                        <input name="floor" value={floor} onChange={handleChange(setFloor)} />
                        {errors.floor && <span className="error-message">{errors.floor}</span>}
                    </div>

                    <div className="edit-form-group">
                        <label>Апартамент</label>
                        <input name="apartmentNumber" value={apartmentNumber} onChange={handleChange(setApartmentNumber)} />
                        {errors.apartmentNumber && <span className="error-message">{errors.apartmentNumber}</span>}
                    </div>

                    <div className="edit-form-group">
                        <label>Живущи</label>
                        <input name="residents" value={residents} onChange={handleChange(setResidents)} />
                    </div>

                    <div className="edit-form-group">
                        <label>Гараж</label>
                        <input name="garageNumber" value={garageNumber} onChange={handleChange(setGarageNumber)} />
                        {errors.garageNumber && <span className="error-message">{errors.garageNumber}</span>}
                    </div>
                </div>

                <div className="edit-form-actions">
                    <button className="edit-primary-button" onClick={handleSave} disabled={loading}>
                        {loading ? 'Запазване...' : 'Запази промените'}
                    </button>
                    <button className="edit-secondary-button" onClick={() => navigate("/admin/users")} disabled={loading}>
                        Отказ
                    </button>
                    <button className="edit-danger-button" onClick={handleDelete} disabled={loading}>
                        Изтрий потребител
                    </button>
                </div>
            </div>
        </div>
    );
}

export default EditUser;
