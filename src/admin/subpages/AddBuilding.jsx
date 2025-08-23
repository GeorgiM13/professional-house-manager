import { useState } from "react"
import { supabase } from "../../supabaseClient"
import { useNavigate } from "react-router-dom"
import "./styles/AddBuilding.css"

function AddBuilding() {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [address, setAddress] = useState("");
    const [floors, setFloors] = useState("");
    const [apartments, setApartments] = useState("");
    const [garages, setGarages] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name || !address || !floors || !apartments) {
            setMessage("Моля, попълнете всички задължителни полета");
            return;
        }

        const newBuilding = {
            name,
            address,
            floors: parseInt(floors),
            apartments: parseInt(apartments),
            garages: garages ? parseInt(garages) : 0,
            created_at: new Date()
        };

        const { data, error } = await supabase
            .from("buildings")
            .insert([newBuilding]);

        if (error) {
            console.error("Supabase insert error:", error);
            setMessage("Грешка при добавяне на сграда");
        } else {
            setMessage("Сградата е успешно добавена!");

            setName("");
            setAddress("");
            setFloors("");
            setApartments("");
            setGarages("");

            setTimeout(() => navigate("/admin/buildings", 1500));
        }

    };

    const handleCancel = () => {
        navigate(-1);
    }


    return (
        <div className="add-building-container">
            <div className="add-building-form-header">
                <h2>Добавяне на сграда</h2>
                <p>Попълнете информацията за новата сграда</p>
            </div>
            <form onSubmit={handleSubmit} className="add-building-form">
                <div className="add-building-form-group">
                    <label>
                        Име на сградата:
                    </label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />

                </div>
                <div className="add-building-form-group">
                    <label>
                        Адрес:
                    </label>
                    <input value={address} onChange={(e) => setAddress(e.target.value)} required></input>

                </div>
                <div className="add-building-form-group">
                    <label>
                        Брой етажи:
                    </label>
                    <input type="number" value={floors} onChange={(e) => setFloors(e.target.value)} required />

                </div>
                <div className="add-building-form-group">
                    <label>
                        Брой апартаменти:
                    </label>
                    <input type="number" value={apartments} onChange={(e) => setApartments(e.target.value)} required />

                </div>
                <div className="add-building-form-group">
                    <label>
                        Брой гаражи:
                    </label>
                    <input type="number" value={garages} onChange={(e) => setGarages(e.target.value)} />

                </div>
                <div className="add-building-form-actions">
                    <button type="submit" className="primary-button">Добави</button>
                    <button type="button" className="secondary-button" onClick={handleCancel}>Отказ</button>
                </div>
            </form>

            {message && <p className="succes-message">{message}</p>}
        </div>
    )


}

export default AddBuilding;