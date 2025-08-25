import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import AsyncSelect from "react-select/async"
import { supabase } from "../../supabaseClient"
import "./styles/AddUser.css"

function AddUser() {
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

    const navigate = useNavigate();

    const loadBuildings = async (inputValue) => {
        const { data, error } = await supabase
            .from("buildings")
            .select("id, name, address, floors, apartments, garages")
            .ilike("name", `%${inputValue || ""}%`)
            .limit(20);

        if (error) {
            console.error("Грешка при зареждане на сгради: ", error);
            return [];
        }

        return (data || []).map(b => ({
            value: b.id,
            label: `${b.name}, ${b.address}`,
            floors: b.floors,
            apartments: b.apartments,
            garages: b.garages
        }))
    }

    const handleSave = async () => {
        const newErrors = {};

        if (!firstName) newErrors.firstName = "Моля въведете първо име";
        if (!lastName) newErrors.lastName = "Моля въведете фамилия";
        if (!selectedBuilding) newErrors.selectedBuilding = "Моля изберете сграда";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }



        const buildingObj = buildings.find(b => b.id === Number(selectedBuilding));

        if (floor && (parseInt(floor) < 1 || parseInt(floor) > buildingObj.floors)) {
            newErrors.floor = `Етажът трябва да е между 1 и ${buildingObj.floors}`;
        }

        if (apartmentNumber && (parseInt(apartmentNumber) < 1 || parseInt(apartmentNumber) > buildingObj.apartments)) {
            newErrors.apartmentNumber = `Апартаментът трябва да е между 1 и ${buildingObj.apartments}`;
        }

        if (garageNumber && (parseInt(garageNumber) < 1 || parseInt(garageNumber) > buildingObj.garages)) {
            newErrors.garageNumber = `Гаражът трябва да е между 1 и ${buildingObj.garages}`;
        }


        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        const building = buildings.find(b => b.id === Number(selectedBuilding))?.name || "";
        const transliterate = str => {
            const map = {
                'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ж': 'zh', 'з': 'z', 'и': 'i',
                'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's',
                'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sht', 'ъ': 'a',
                'ь': '', 'ю': 'yu', 'я': 'ya'
            };
            return str.toLowerCase().split('').map(c => map[c] || c).join('');
        }

        const clean = str => transliterate(str).replace(/\s+/g, '');

        const username = `${clean(firstName)}_${clean(building)}_${floor}_${apartmentNumber}`;
        const email = `${username}@example.com`;
        const password = clean(`${firstName}_${secondName}_${lastName}`);
        const displayName = `${firstName} ${secondName} ${lastName}`.trim();

        const { data: authUser, error: authError } = await supabase.auth.signUp({
            email,
            password
        }, {
            data: {
                display_name: displayName
            }
        });

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
                    email,
                    password_hash: password,
                },
            ])
            .select()
            .single();

        if (userError) {
            console.error("Грешка при добавяне на потребител:", userError);
            return;
        }

        if (apartmentNumber) {
            await supabase.from("apartments").insert([
                {
                    user_id: newUser.id,
                    floor,
                    number: apartmentNumber,
                    residents,
                    building_id: selectedBuilding,
                },
            ]);
        }

        if (garageNumber) {
            await supabase.from("garages").insert([
                {
                    user_id: newUser.id,
                    number: garageNumber,
                    building_id: selectedBuilding,
                },
            ]);
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
                <div className="form-grid">
                    <div className={`form-group ${errors.firstName ? 'has-error' : ''}`}>
                        <label>Първо име *</label>
                        <input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                        {errors.firstName && <span className="error-message">{errors.firstName}</span>}
                    </div>

                    <div className="form-group">
                        <label>Презиме</label>
                        <input value={secondName} onChange={(e) => setSecondName(e.target.value)} />
                    </div>

                    <div className={`form-group ${errors.lastName ? 'has-error' : ''}`}>
                        <label>Фамилия *</label>
                        <input value={lastName} onChange={(e) => setLastName(e.target.value)} />
                        {errors.lastName && <span className="error-message">{errors.lastName}</span>}
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

                    <div className={`form-group ${errors.selectedBuilding ? 'has-error' : ''}`}>
                        <label>Сграда *</label>
                        <AsyncSelect
                            cacheOptions
                            defaultOptions
                            loadOptions={loadBuildings}
                            onChange={(option) => setSelectedBuilding(option)}
                            placeholder="Търсене на сграда..."
                        />
                        {errors.selectedBuilding && <span className="error-message">{errors.selectedBuilding}</span>}
                    </div>

                    <div className="form-group">
                        <label>Етаж</label>
                        <input value={floor} onChange={(e) => setFloor(e.target.value)} />
                        {errors.floor && <span className="error-message">{errors.floor}</span>}
                    </div>

                    <div className="form-group">
                        <label>Апартамент</label>
                        <input value={apartmentNumber} onChange={(e) => setApartmentNumber(e.target.value)} />
                        {errors.apartmentNumber && <span className="error-message">{errors.apartmentNumber}</span>}
                    </div>

                    <div className="form-group">
                        <label>Живущи</label>
                        <input value={residents} onChange={(e) => setResidents(e.target.value)} />
                    </div>

                    <div className="form-group">
                        <label>Гараж</label>
                        <input value={garageNumber} onChange={(e) => setGarageNumber(e.target.value)} />
                        {errors.garageNumber && <span className="error-message">{errors.garageNumber}</span>}
                    </div>
                </div>

                <div className="form-actions">
                    <button className="primary-button" onClick={handleSave}>Запази</button>
                    <button className="secondary-button" onClick={() => navigate("/admin/users")}>Отказ</button>
                </div>
            </div>
        </div>
    );
}

export default AddUser;
