import { useState, useEffect } from "react"
import { supabase } from "../../supabaseClient"
import { useNavigate } from "react-router-dom"
import "./styles/AddEvent.css"

function AddEventPage() {
    const navigate = useNavigate();
    const [buildings, setBuildings] = useState([]);
    const [users, setUsers] = useState([]);
    const [newEvent, setNewEvent] = useState({
        status: "ново",
        subject: "",
        description: "",
        completion_date: "",
        assigned_to: "",
        building_id: ""
    });

    useEffect(() => {
        async function fetchBuildings() {
            const { data } = await supabase.from("buildings").select("*");
            setBuildings(data || []);
        }
        fetchBuildings();

        async function fetchUsers() {
            const { data } = await supabase.from("users").select("*");
            setUsers((data || []).filter(u => u.role === "admin"));
        }
        fetchUsers();
    }, []);

    const handleCreateEvent = async () => {
        const { error } = await supabase.from("events").insert([newEvent]);
        if (!error) {
            navigate("/admin/adminevents");
        } else {
            console.error(error);
        }
    };

  return (
    <div className="container">
        <h1>Добавяне на ново събитие</h1>

        <div className="form-group">
            <select
            value={newEvent.status}
            onChange={(e) => setNewEvent({ ...newEvent, status: e.target.value })}
            >
            <option value="ново">ново</option>
            <option value="изпълнено">изпълнено</option>
        </select>

        <input
            placeholder="Относно"
            value={newEvent.subject}
            onChange={(e) => setNewEvent({ ...newEvent, subject: e.target.value })}
        />

        <textarea
            placeholder="Описание"
            value={newEvent.description}
            onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
        />

        <input
            type="datetime-local"
            value={newEvent.completion_date}
            onChange={(e) => setNewEvent({ ...newEvent, completion_date: e.target.value })}
        />

        <select
            value={newEvent.building_id}
            onChange={(e) => setNewEvent({ ...newEvent, building_id: e.target.value })}
        >
            <option value="">Избери сграда</option>
            {buildings.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
            ))}
        </select>

        <select
            value={newEvent.assigned_to}
            onChange={(e) => setNewEvent({ ...newEvent, assigned_to: e.target.value })}
        >
            <option value="">Възложено на</option>
            {users.map(u => (
                <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>
            ))}
        </select>
        </div>

        <div className="buttons">
            <button className="save" onClick={handleCreateEvent}>
                Запази
            </button>
            <button className="cancel" onClick={() => navigate("/admin/adminevents")}>
                Отказ
            </button>
        </div>

    </div>
  );
}

export default AddEventPage;
