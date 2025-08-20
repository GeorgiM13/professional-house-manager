import { useState, useEffect, useRef } from "react"
import { supabase } from "../../supabaseClient"
import { useNavigate } from "react-router-dom"
import "./styles/AddReport.css"

function AddUserReport() {
    const user = JSON.parse(localStorage.getItem("user"));
    const [buildings, setBuildings] = useState([]);
    const [selectedBuilding, setSelectedBuilding] = useState("all");
    const [subject, setSubject] = useState("");
    const [description, setDescription] = useState("");
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [message, setMessage] = useState("");

    const buildingCache = useRef({});
    const navigate = useNavigate();

    useEffect(() => {
        async function fetchBuildings() {
            if (!user) return;

            if (buildingCache.current[user.id]) {
                setBuildings(buildingCache.current[user.id]);
                return;
            }

            const { data, error } = await supabase
                .from("user_buildings")
                .select(`building:building_id (id,name,address)`)
                .eq("user_id", user.id);

            if (!error) {
                const mapped = (data || []).map((ub) => ub.building).filter(Boolean);
                setBuildings(mapped);
                buildingCache.current[user.id] = mapped;
            }
        }

        fetchBuildings();
    }, [user]);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!subject || !description || selectedBuilding === "all") return;

        setLoadingSubmit(true);

        const { data, error } = await supabase.from("reports").insert([{
            status: "ново",
            subject,
            description,
            notes: "",
            submitted_by: user.id,
            building_id: selectedBuilding
        }]);

        if (error) {
            setMessage("Грешка при подаване на сигнал.");
        } else {
            setMessage("Сигналът беше успешно подаден!");
            setSubject("");
            setDescription("");

            setTimeout(() => navigate(-1), 1500);
        }

        setLoadingSubmit(false);
    }


    useEffect(() => {
        if (buildings.length === 1) {
            setSelectedBuilding(buildings[0].id);
        }
    }, [buildings]);

    return (
        <div className="container">
            <h1>Подай сигнал</h1>

            <div className="form-group">

                {buildings.length === 1 && buildings[0] ? (
                    <>
                        <label >Вашата сграда:</label>
                        <input type="text"
                            value={`${buildings[0].name} – ${buildings[0].address}`}
                            readOnly
                            className="readonly-input"
                        />
                    </>

                ) : (
                    <select value={selectedBuilding} onChange={(e) => setSelectedBuilding(e.target.value)}>
                        <option value="all">Избери сграда</option>
                        {buildings.map((b) => (
                            <option key={b.id} value={b.id}>{b.name} – {b.address}</option>
                        ))}
                    </select>
                )}
                <input
                    placeholder="Относно"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                />

                <textarea
                    placeholder="Описание"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                />
            </div>

            <div className="buttons">
                <button
                    className="save"
                    onClick={handleSubmit}
                    disabled={loadingSubmit || selectedBuilding === "all"}
                >
                    {loadingSubmit ? "Изпращане..." : "Подай сигнал"}
                </button>
                <button className="cancel" onClick={() => navigate(-1)}>
                    Отказ
                </button>
            </div>

            {message && <p className="success-message">{message}</p>}
        </div>
    );
}

export default AddUserReport;
