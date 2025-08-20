import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "../../supabaseClient"
import "./styles/EditEvent.css"

function EditEvent() {
    const { id } = useParams();
    const navigate = useNavigate();
  
    const [formData, setFormData] = useState({
        status: "",
        subject: "",
        description: "",
        completion_date: "",
        assigned_to: ""
    });

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchEvent() {
            const { data, error } = await supabase
            .from("events")
            .select("*")
            .eq("id", id)
            .single();

        if (!error && data) {
            setFormData({
                status: data.status || "",
                subject: data.subject || "",
                description: data.description || "",
                completion_date: data.completion_date
                    ? data.completion_date.slice(0,16) 
                    : "",
                assigned_to: data.assigned_to || ""
            });
        }
            setLoading(false);
        }

        async function fetchUsers() {
            const { data, error } = await supabase
                .from("users")
                .select("id, first_name, last_name, role");

            if (!error) {
                setUsers((data || []).filter(u => u.role === "admin"));
            }
    }

    fetchEvent();
    fetchUsers();
    }, [id]);

    async function handleSubmit(e) {
        e.preventDefault();

        const updateData = {
            status: formData.status,
            subject: formData.subject,
            description: formData.description,
            completion_date: formData.completion_date,
            assigned_to: formData.assigned_to || ""
        };

        const { error } = await supabase
            .from("events")
            .update(updateData)
            .eq("id", Number(id));

        if (error) {
            alert("Грешка при запазване! " + error.message);
        } else {
            alert("Събитието е обновено успешно!");
            navigate(`/admin/adminevents`);
        }
    }

    async function handleDelete() {
        if (!window.confirm("Наистина ли искате да изтриете това събитие?")) return;

        const { error } = await supabase
            .from("events")
            .delete()
            .eq("id", id);  

        if (error) {
            alert("Грешка при изтриване! " + error.message);
        } else {
            alert("Събитието е изтрито успешно!");
            navigate("/admin/adminevents"); 
        }
    }

    if (loading) return <p className="loading-text">Зареждане...</p>;

    return (
        <div className="edit-event-container">
            <h1 className="page-title">Редакция на събитие</h1>
            <form onSubmit={handleSubmit} className="event-form">
        
                <label>Състояние</label>
                <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                    <option value="ново">ново</option>
                    <option value="изпълнено">изпълнено</option>
                </select>

                <label>Относно</label>
                <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                />

                <label>Описание</label>
                <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />

                <label>Дата на изпълнение</label>
                <input
                type="datetime-local"
                value={formData.completion_date}
                onChange={(e) => setFormData({ ...formData, completion_date: e.target.value })}
                />

                <label>Възложено на:</label>
                <select
                value={formData.assigned_to}
                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                >
                    <option value="">-</option>
                    {users.map((user) => (
                    <option key={user.id} value={user.id}>
                        {user.first_name} {user.last_name}
                    </option>
                    ))}
                </select>

                <div className="form-buttons">
                    <button type="submit" className="btn primary">Запази</button>
                    <button type="button" className="btn secondary" onClick={() => navigate(-2)}>Отказ</button>
                    <button type="button" className="btn danger" onClick={handleDelete}>Изтрий</button>
                </div>
            </form>
        </div>
    );
}

export default EditEvent;
