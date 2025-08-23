import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "../../supabaseClient"
import "./styles/EditBuilding.css"

function EditBuilding() {

    const { id } = useParams();
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [address, setAddress] = useState("");
    const [floors, setFloors] = useState("");
    const [apartments, setApartments] = useState("");
    const [garages, setGarages] = useState("");
    const [message, setMessage] = useState("");

    useEffect(() => {
        fetchBuilding();
    }, [id]);

    const fetchBuilding = async () => {
        const { data, error } = await supabase
            .from("buildings")
            .select("*")
            .eq("id", id)
            .single();

        if (error) {
            console.error("Error loading building:", error);
            setMessage("Грешка при зареждане на сградата");
        } else {
            setName(data.name);
            setAddress(data.address);
            setFloors(data.floors);
            setApartments(data.apartments);
            setGarages(data.garages);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();

        const { error } = await supabase
            .from("buildings")
            .update({
                name,
                address,
                floors: parseInt(floors),
                apartments: parseInt(apartments),
                garages: garages ? parseInt(garages) : 0,
            })
            .eq("id", id);

        if (error) {
            console.error("Update error:", error);
            setMessage("Грешка при редакция")
        } else {
            setMessage("Успешно редактирана!")
            setTimeout(() => navigate("/admin/buildings", 1500));
        }
    };

    const handleDelete = async (e) => {
        if (!window.confirm("Наистина ли искате да изтриете тази сграда?")) return;

        const { error } = await supabase
            .from("buildings")
            .delete()
            .eq("id", id);

        if (error) {
            setMessage("Грешка при изтриване! " + error.message);
        } else {
            setMessage("Сградата е изтрита успешно!");
            navigate("/admin/buildings");
        }
    };

    return (
        <div className="edit-building-container">
            <h2>Редакция на сграда</h2>
            <form onSubmit={handleUpdate} className="edit-building-form">
                <label>
                    Име на сградата:
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                </label>
                <label>
                    Адрес:
                    <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} required />
                </label>
                <label>
                    Брой етажи:
                    <input type="number" value={floors} onChange={(e) => setFloors(e.target.value)} required />
                </label>
                <label>
                    Брой апартаменти:
                    <input type="number" value={apartments} onChange={(e) => setApartments(e.target.value)} required />
                </label>
                <label>
                    Брой гаражи:
                    <input type="number" value={garages} onChange={(e) => setGarages(e.target.value)} required />
                </label>

                <div className="form-buttons">
                    <button type="submit" className="btn primary">Запази</button>
                    <button type="button" className="btn secondary" onClick={() => navigate(-1)}>Отказ</button>
                    <button type="button" className="btn danger" onClick={handleDelete}>Изтрий</button>
                </div>
            </form>
        </div>
    )


}

export default EditBuilding;