import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../../supabaseClient"
import "./styles/AddUserToBuilding.css"

function AddUserToBuilding() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [buildings, setBuildings] = useState([]);
    const [selectedUser, setSelectedUser] = useState("");
    const [selectedBuilding, setSelectedBuilding] = useState("");
    const [floor, setFloor] = useState("");
    const [apartmentNumber, setApartmentNumber] = useState("");
    const [residents, setResidents] = useState("");
    const [garageNumber, setGarageNumber] = useState("");
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        async function fetchData() {
            const { data: usersData, error: usersError } = await supabase
                .from("users")
                .select("*");
            if (usersError) console.error(usersError);
            else setUsers(usersData);

            const { data: buildingsData, error: buildingsError } = await supabase
                .from("buildings")
                .select("*");
            if (buildingsError) console.error(buildingsError);
            else setBuildings(buildingsData);
        }
        fetchData();
    }, []);

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
                user_id: selectedUser,
                building_id: selectedBuilding,
                floor,
                number: apartmentNumber,
                residents
            }]);

            if (garageNumber) {
                await supabase.from("garages").insert([{
                    user_id: selectedUser,
                    building_id: selectedBuilding,
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
                        <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)}>
                            <option value="">-- Изберете потребител --</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>
                                    {u.first_name} {u.second_name} {u.last_name}
                                </option>
                            ))}
                        </select>
                        {errors.selectedUser && <span className="error-message">{errors.selectedUser}</span>}
                    </div>


                    <div className="add-user-building-form-group">
                        <label>Сграда *</label>
                        <select value={selectedBuilding} onChange={e => setSelectedBuilding(e.target.value)}>
                            <option value="">-- Изберете сграда --</option>
                            {buildings.map(b => (
                                <option key={b.id} value={b.id}>
                                    {b.name}, {b.address}
                                </option>
                            ))}
                        </select>
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
