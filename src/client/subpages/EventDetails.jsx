import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "../../supabaseClient"
import "./styles/EventDetails.css"

function EventDetails() {

    const { id } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);

    useEffect(() => {
        async function fetchEvent() {
            const { data, error } = await supabase
                .from("events")
                .select(`
                id,
                status,
                subject,
                description,
                completion_date,
                created_at,
                assigned_user:assigned_to(first_name,last_name),
                building_id,
                building:building_id(name,address)
                `)
                .eq("id", id)
                .single();

            if (error) {
                console.error("Supabase error:", error);
            } else {
                setEvent(data);
            }
        }
        fetchEvent();
    }, [id]);

    

    function formatDateTime(dateString) {
        if (!dateString) return "";
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");

        return `${day}.${month}.${year} ${hours}:${minutes}`;
    }

    

    if (!event) return <p>Зареждане...</p>

    return (

        <div className="event-details-page">
            <button onClick={() => navigate(-1)}>← Назад към списъка</button>
            <h1>Детайли за събитието</h1>
            <p><strong>Адрес:</strong> {event.building?.name}, {event.building?.address}</p>
            <p><strong>Състояние:</strong> {event.status}</p>
            <p><strong>Относно:</strong> {event.subject}</p>
            <p><strong>Описание:</strong> {event.description || "-"}</p>
            <p><strong>Дата на изпълнение:</strong> {formatDateTime(event.completion_date)}</p>
            <p><strong>Дата на добавяне:</strong> {formatDateTime(event.created_at)}</p>
            <p><strong>Възложено на:</strong> {event.assigned_user ? `${event.assigned_user.first_name} ${event.assigned_user.last_name}` : "-"}</p>

        </div>

    );

}

export default EventDetails;