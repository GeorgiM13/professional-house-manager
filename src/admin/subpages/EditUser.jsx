import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { supabase } from "../../supabaseClient"
import "./styles/EditUser.css"

function EditUser() {
    const navigate = useNavigate();
    const { id } = useParams();

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
                if (userData.apartments && userData.apartments.length > 0) {
                    setFloor(userData.apartments[0].floor || "");
                    setApartmentNumber(userData.apartments[0].number || "");
                    setResidents(userData.apartments[0].residents || "");
                    setSelectedBuilding(userData.apartments[0].building_id);
                }

                if (userData.garages && userData.garages.length > 0) {
                    setGarageNumber(userData.garages[0].number || "");
                }
            } catch (error) {
                console.error("Грешка при зареждане на потребителя:", error.message);
                alert("Грешка при зареждане на данни");
            } finally {
                setIsLoadingData(false);
            }
        }

        fetchData();
    }, [id]);

    const handleChange = (setter) => (e) => {
        setter(e.target.value);
        setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    };

    const handleSave = async () => {
        const newErrors = {};
        if (!firstName) newErrors.firstName = "Моля въведете първо име";
        if (!lastName) newErrors.lastName = "Моля въведете фамилия";
        if (!selectedBuilding) newErrors.selectedBuilding = "Моля изберете сграда";

        const buildingObj = buildings.find(b => b.id === Number(selectedBuilding));

        if (buildingObj) {
            if (floor && (parseInt(floor) < 1 || parseInt(floor) > buildingObj.floors)) {
                newErrors.floor = `Етажът трябва да е между 1 и ${buildingObj.floors}`;
            }

            if (apartmentNumber && (parseInt(apartmentNumber) < 1 || parseInt(apartmentNumber) > buildingObj.apartments)) {
                newErrors.apartmentNumber = `Апартаментът трябва да е между 1 и ${buildingObj.apartments}`;
            }

            if (garageNumber && (parseInt(garageNumber) < 1 || parseInt(garageNumber) > buildingObj.garages)) {
                newErrors.garageNumber = `Гаражът трябва да е между 1 и ${buildingObj.garages}`;
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);

        try {
            await supabase.from("users").update({
                first_name: firstName,
                second_name: secondName,
                last_name: lastName,
                phone,
                role,
            }).eq("id", id);

            if (apartmentNumber) {
                const { data: existingApartment } = await supabase
                    .from("apartments")
                    .select("*")
                    .eq("user_id", id)
                    .single();

                if (existingApartment) {
                    await supabase.from("apartments").update({
                        floor,
                        number: apartmentNumber,
                        residents,
                        building_id: selectedBuilding,
                    }).eq("id", existingApartment.id);
                }

            }

            const { data: existingGarage } = await supabase
                .from("garages")
                .select("*")
                .eq("user_id", id)
                .single();

            if (garageNumber) {
                if (existingGarage) {
                    await supabase.from("garages").update({
                        number: garageNumber,
                        building_id: selectedBuilding,
                    }).eq("id", existingGarage.id);
                } else {
                    await supabase.from("garages").insert([{
                        user_id: id,
                        number: garageNumber,
                        building_id: selectedBuilding,
                    }]);
                }
            } else if (existingGarage) {
                await supabase.from("garages").delete().eq("id", existingGarage.id);
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
            const { data: apartmentsData, error: apartmentsError } = await supabase
                .from("apartments")
                .select("*")
                .eq("user_id", id);

            if (apartmentsError) throw apartmentsError;

            const { data: garagesData, error: garagesError } = await supabase
                .from("garages")
                .select("*")
                .eq("user_id", id);

            if (garagesError) throw garagesError;

            if ((apartmentsData?.length === 0) && (garagesData?.length === 0)) {
                await supabase.from("users").delete().eq("id", id);
                alert("Потребителят е изтрит напълно.");
            } else {
                alert("Потребителят има данни в други сгради и не може да бъде изтрит напълно.");
            }

            await supabase.from("apartments").delete().eq("user_id", id).eq("building_id", selectedBuilding);
            await supabase.from("garages").delete().eq("user_id", id).eq("building_id", selectedBuilding);

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
                        <select name="selectedBuilding" value={selectedBuilding} onChange={handleChange(setSelectedBuilding)}>
                            <option value="">-- Изберете сграда --</option>
                            {buildings.map(b => <option key={b.id} value={b.id}>{b.name}, {b.address}</option>)}
                        </select>
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
