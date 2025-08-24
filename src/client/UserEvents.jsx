import { useState, useEffect, useRef } from "react"
import { supabase } from "../supabaseClient"
import { useNavigate } from "react-router-dom"
import "./styles/UserEvents.css"

function UserEvents() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const [events, setEvents] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [loadingBuildings, setLoadingBuildings] = useState(true);
  const [selectedBuilding, setSelectedBuilding] = useState("all");
  const eventsCache = useRef({});
  const buildingCache = useRef({});

  useEffect(() => {
    async function fetchBuildings() {
      if (!user) return;

      if (buildingCache.current[user.id]) {
        setBuildings(buildingCache.current[user.id]);
        setLoadingBuildings(false);
        return;
      }

      const { data: apartmentsData, error: apartmentsError } = await supabase
        .from("apartments")
        .select(`building:building_id (id,name,address)`)
        .eq("user_id", user.id);


      const { data: garagesData, error: garagesError } = await supabase
        .from("garages")
        .select(`building:building_id (id,name,address)`)
        .eq("user_id", user.id);

      if (!apartmentsError && !garagesError) {
        const allBuildings = [
          ...(apartmentsData || []).map(a => a.building),
          ...(garagesData || []).map(g => g.building)
        ]

        const uniqueBuildings = Array.from(new Map(allBuildings.map(b => [b.id, b])).values());

        setBuildings(uniqueBuildings);
      }
      setLoadingBuildings(false);
    }

    fetchBuildings();
  }, [user]);

  useEffect(() => {
    async function fetchEvents() {
      if (!user || loadingBuildings) return;

      const cacheKey = selectedBuilding;

      if (eventsCache.current[cacheKey]) {
        setEvents(eventsCache.current[cacheKey]);
        return;
      }

      let query = supabase
        .from("events")
        .select(`
          id,
          status,
          subject,
          completion_date,
          created_at,
          building_id,
          building:building_id(name,address)
        `)
        .order("completion_date", { ascending: false });

      if (selectedBuilding !== "all") {
        query = query.eq("building_id", selectedBuilding);
      } else if (buildings.length > 0) {
        query = query.in(
          "building_id",
          buildings.map((b) => b.id)
        );
      }

      const { data, error } = await query;
      if (error) {
        console.error("Грешка при зареждане на събития:", error);
      } else {
        setEvents(data || []);
        eventsCache.current[cacheKey] = data || [];
      }
    }

    fetchEvents();
  }, [user, selectedBuilding, buildings, loadingBuildings]);

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

  useEffect(() => {
    if (buildings.length === 1) {
      setSelectedBuilding(buildings[0].id)
    }
  }, [buildings]);


  return (
    <div className="events-page">
      <div className="events-header">
        <h1>Моите събития</h1>

        {buildings.length === 1 && buildings[0] ? (

          <>
            <div className="building-badge">
              <p className="building-label">Вашата сграда: </p>
              <p className="building-info">
                {buildings[0].name} - {buildings[0].address}
              </p>
            </div>
          </>
        ) : (

          <select
            value={selectedBuilding}
            onChange={(e) => setSelectedBuilding(e.target.value)}
          >
            <option value="all">Всички сгради</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} – {b.address}
              </option>
            ))}
          </select>
        )}


      </div>


      {loadingBuildings ? (
        <p style={{ textAlign: "center", padding: "1rem" }}>Зареждане на събития...</p>
      ) : (
        <table className="events-table">
          <thead>
            <tr>
              <th>№</th>
              <th>Адрес</th>
              <th>Състояние</th>
              <th>Относно</th>
              <th>Дата на изпълнение</th>
              <th>Дата на добавяне</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: "1rem" }}>
                  Нямате събития.
                </td>
              </tr>
            ) : (

              events.map((event, idx) => (
                <tr key={event.id} onClick={() => navigate(`/client/event/${event.id}`)} style={{ cursor: "pointer" }}>
                  <td data-label="№">{idx + 1}</td>
                  <td data-label="Адрес">
                    {event.building?.name}, {event.building?.address}
                  </td>
                  <td data-label="Състояние">
                    <span
                      className={
                        event.status === "ново"
                          ? "status-badge status-new"
                          : event.status === "изпълнено"
                            ? "status-badge status-done"
                            : "status-badge"
                      }
                    >
                      {event.status}
                    </span>
                  </td>
                  <td data-label="Относно">{event.subject}</td>
                  <td data-label="Дата на изпълнение">{formatDateTime(event.completion_date)}</td>
                  <td data-label="Дата на добавяне">{formatDateTime(event.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default UserEvents;
