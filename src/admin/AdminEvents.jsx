import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../supabaseClient"
import "./styles/AdminEvents.css"

function AdminEvents() {
    const navigate = useNavigate();
    const [buildings, setBuildings] = useState([]);
    const [selectedBuilding, setSelectedBuilding] = useState("all");
    const [events, setEvents] = useState([]);
   // const [showPastEvents, setShowPastEvents] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const pageSize = 20;

    useEffect(() => {
        async function fetchBuildings() {
            const { data } = await supabase.from("buildings").select("*");
            setBuildings(data || []);
        }
        fetchBuildings();
    }, []);

    useEffect(() => {
        async function fetchEvents() {

            const from = (currentPage - 1) * pageSize;
            const to = from + pageSize - 1;


            let query = supabase
                .from("events")
                .select(`
                id,
                status,
                subject,
                completion_date,
                created_at,
                assigned_user:assigned_to(first_name,last_name),
                building_id,
                building:building_id(name,address)
                `,
                {count: "exact"}
                )
                .order("completion_date", { ascending: false })
                .range(from,to);

            if (selectedBuilding !== "all") {
                query = query.eq("building_id", selectedBuilding);
            }

            const { data, error, count } = await query;
            if (error) {
                console.error("Supabase error:", error);
            } else{
            setEvents(data || []);
            setTotalCount(count || 0);
            }
        }
        fetchEvents();
    }, [selectedBuilding, currentPage, pageSize]);


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

    const totalPages = Math.ceil(totalCount / pageSize);

   // function isPast(dateString) {
   //     if (!dateString) return false;
   //     return new Date(dateString) < new Date();
   // }


    return (
        <div className="events-page">
            <div className="events-header">
                <h1>Събития</h1>
                <select value={selectedBuilding} onChange={(e) => {
                    setSelectedBuilding(e.target.value).
                    setCurrentPage(1);}}>
                    <option value="all">Всички сгради</option>
                    {buildings.map((building) => (
                        <option key={building.id} value={building.id}>{building.name}</option>
                    ))}
                </select>
            </div>

            <div className="events-subheader">
                <div className="left">
                    <span>Задачи, общи събрания и предстоящи дейности</span>
                    <p>Преглед на всички събития</p>
                </div>
                <div className="right">
                    <button onClick={() => navigate("/admin/addevent")}>Добавяне на събитие</button>
                </div>
            </div>

        {/*   <div className="events-filter">
                <label>
                    <input
                        type="checkbox"
                        checked={showPastEvents}
                        onChange={() => setShowPastEvents(!showPastEvents)}
                    />
                    Показвай минали събития
                </label>
            </div>

        */}
        
            <table className="events-table">
                <thead>
                    <tr>
                        <th>№</th>
                        <th>Адрес</th>
                        <th>Състояние</th>
                        <th>Относно</th>
                        <th>Дата на изпълнение</th>
                        <th>Дата на добавяне</th>
                        <th>Възложено на</th>
                    </tr>
                </thead>
                <tbody>
                    {events
                    //.filter(event => showPastEvents || !isPast(event.completion_date))
                    .map((event, idx) => (
                        <tr key={event.id}
                            onClick={() => navigate(`/admin/event/${event.id}`)}
                            style={{ cursor: "pointer" }}>
                            <td>{idx + 1}</td>
                            <td>{event.building?.name}, {event.building?.address}</td>
                            <td>
                                <span className={
                                    event.status === "ново"
                                        ? "status-badge status-new"
                                        : event.status === "изпълнено"
                                            ? "status-badge status-done"
                                            : "status-badge"
                                }> {event.status}
                                </span>
                            </td>
                            <td>{event.subject}</td>
                            <td>{formatDateTime(event.completion_date)}</td>
                            <td>{formatDateTime(event.created_at)}</td>
                            <td>{event.assigned_user ? `${event.assigned_user.first_name} ${event.assigned_user.last_name}` : "-"}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

                    <div className="pagination">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                        >
                            ⬅ Предишна
                        </button>
                        <span>Страница {currentPage} от {totalPages}</span>
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => p + 1)}
                        >
                            Следваща ➡
                        </button>
                    </div>

        </div>
    );
}

export default AdminEvents;
