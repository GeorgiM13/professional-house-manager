import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AsyncSelect from "react-select/async";
import { supabase } from "../../supabaseClient";
import "./styles/AddUserToBuilding.css";

function AddUserToBuilding() {
    const navigate = useNavigate();
    const [buildings, setBuildings] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedBuilding, setSelectedBuilding] = useState("");
    const [floor, setFloor] = useState("");
    const [apartmentNumber, setApartmentNumber] = useState("");
    const [residents, setResidents] = useState("");
    const [garageNumber, setGarageNumber] = useState("");
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        async function fetchBuildings() {
            const { data: buildingsData, error } = await supabase
                .from("buildings")
                .select("*");
            if (error) console.error(error);
            else setBuildings(buildingsData);
        }
        fetchBuildings();
    }, []);

    const loadUsers = async (inputValue) => {
        if (!inputValue) return [];
        const { data } = await supabase
            .from("users")
            .select("id, first_name, second_name, last_name")
            .ilike("first_name", `%${inputValue}%`)
            .limit(20);
        return data.map(u => ({
            value: u.id,
            label: `${u.first_name} ${u.second_name} ${u.last_name}`,
        }));
    };

    const handleSave = async () => {
        const newErrors = {};
        if (!selectedUser) newErrors.selectedUser = "Изберете потребител";
        if (!selectedBuilding) newErrors.selectedBuilding = "Изберете сграда";
        if (!apartmentNumber) newErrors.apartmentNumber = "Въведете номер на апартамент";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);
        try {
            await supabase.from("apartments").insert([{
                user_id: selectedUser.value,
                building_id: selectedBuilding.value,
                floor,
                number: apartmentNumber,
                residents
            }]);

            if (garageNumber) {
                await supabase.from("garages").insert([{
                    user_id: selectedUser.value,
                    building_id: selectedBuilding.value,
                    number: garageNumber
                }]);
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
                            cacheOptions
                            defaultOptions
                            loadOptions={loadUsers}
                            onChange={(option) => setSelectedUser(option)}
                            placeholder="Търсене на потребител..."
                        />
                        {errors.selectedUser && <span className="error-message">{errors.selectedUser}</span>}
                    </div>

                    <div className="add-user-building-form-group">
                        <label>Сграда *</label>
                        <AsyncSelect
                            cacheOptions
                            defaultOptions
                            loadOptions={async (inputValue) => {
                                if (!inputValue) return [];
                                const { data } = await supabase
                                    .from("buildings")
                                    .select("id, name, address")
                                    .ilike("name", `%${inputValue}%`)
                                    .limit(50);
                                return data.map(b => ({
                                    value: b.id,
                                    label: `${b.name}, ${b.address}`,
                                }));
                            }}
                            onChange={(option) => setSelectedBuilding(option)}
                            placeholder="Търсене на сграда..."
                        />
                        {errors.selectedBuilding && <span className="error-message">{errors.selectedBuilding}</span>}
                    </div>

                    <div className="add-user-building-form-group">
                        <label>Етаж</label>
                        <input value={floor} onChange={e => setFloor(e.target.value)} />
                    </div>

                    <div className="add-user-building-form-group">
                        <label>Апартамент *</label>
                        <input value={apartmentNumber} onChange={e => setApartmentNumber(e.target.value)} />
                        {errors.apartmentNumber && <span className="error-message">{errors.apartmentNumber}</span>}
                    </div>

                    <div className="add-user-building-form-group">
                        <label>Живущи</label>
                        <input value={residents} onChange={e => setResidents(e.target.value)} />
                    </div>

                    <div className="add-user-building-form-group">
                        <label>Гараж</label>
                        <input value={garageNumber} onChange={e => setGarageNumber(e.target.value)} />
                    </div>
                </div>

                <div className="add-user-building-form-buttons">
                    <button className="add-user-building-btn-primary" onClick={handleSave} disabled={loading}>
                        {loading ? "Запазване..." : "Запази"}
                    </button>
                    <button className="add-user-building-btn-secondary" onClick={() => navigate("/admin/users")} disabled={loading}>
                        Отказ
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AddUserToBuilding;
