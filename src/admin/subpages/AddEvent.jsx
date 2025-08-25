import { useState, useEffect } from "react"
import { supabase } from "../../supabaseClient"
import AsyncSelect from "react-select/async"
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
        <div className="add-event-container">
            <div className="form-header">
                <h1>Добавяне на ново събитие</h1>
                <p>Попълнете формата за ново събитие</p>
            </div>

            <form className="event-form">
                <div className="form-grid">
                    <div className="form-group">
                        <label>Статус</label>
                        <select value={newEvent.status} onChange={(e) => setNewEvent({ ...newEvent, status: e.target.value })}>
                            <option value="ново">ново</option>
                            <option value="изпълнено">изпълнено</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Относно</label>
                        <input value={newEvent.subject} onChange={(e) => setNewEvent({ ...newEvent, subject: e.target.value })} />
                    </div>

                    <div className="form-group">
                        <label>Дата и час на изпълнение</label>
                        <input type="datetime-local" value={newEvent.completion_date} onChange={(e) => setNewEvent({ ...newEvent, completion_date: e.target.value })} />
                    </div>

                    <div className="form-group">
                        <label>Сграда</label>
                        <AsyncSelect
                            className="custom-select"
                            classNamePrefix="custom"
                            cacheOptions
                            defaultOptions
                            loadOptions={async (inputValue) => {
                                const { data } = await supabase
                                    .from("buildings")
                                    .select("id, name, address")
                                    .ilike("name", `%${inputValue || ""}%`)
                                    .limit(10);
                                return data.map(b => ({
                                    value: b.id,
                                    label: `${b.name}, ${b.address}`
                                }));
                            }}
                            onChange={(option) => setNewEvent({ ...newEvent, building_id: option ? option.value : "" })}
                            placeholder="Търсене на сграда..."
                            isClearable
                        />
                    </div>

                    <div className="form-group">
                        <label>Възложено на</label>
                        <select value={newEvent.assigned_to} onChange={(e) => setNewEvent({ ...newEvent, assigned_to: e.target.value })}>
                            <option value="">Възложено на</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>)}
                        </select>
                    </div>

                    <div className="form-group full-width">
                        <label>Описание</label>
                        <textarea value={newEvent.description} onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })} />
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" className="primary-button" onClick={handleCreateEvent}>Запази</button>
                    <button type="button" className="secondary-button" onClick={() => navigate("/admin/adminevents")}>Отказ</button>
                </div>
            </form>
        </div>

    );
}

export default AddEventPage;
