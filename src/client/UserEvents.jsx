import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { useUserBuildings } from "./hooks/useUserBuildings";
import { useLocalUser } from "./hooks/useLocalUser";
import BuildingSelector from "./components/BuildingSelector";
import "./styles/UserEvents.css";

function UserEvents() {
  const navigate = useNavigate();
  const { userId } = useLocalUser();
  const [events, setEvents] = useState([]);
  const { buildings, loading } = useUserBuildings(userId);
  const [selectedBuilding, setSelectedBuilding] = useState("all");
  const eventsCache = useRef({});

  const idsKey = useMemo(() => (
    buildings.length ? buildings.map((b) => b.id).sort().join(",") : ""
  ), [buildings]);

  useEffect(() => {
    let cancelled = false;
    async function fetchEvents() {
      if (!userId || loading) return;

      const cacheKey = `${selectedBuilding}|${idsKey}`;
      const cached = eventsCache.current[cacheKey];
      if (cached) {
        setEvents(cached);
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
        query = query.in("building_id", buildings.map((b) => b.id));
      }

      const { data, error } = await query;
      if (error) {
        console.error("Supabase error (events):", error);
      } else if (!cancelled) {
        const next = data || [];
        setEvents(next);
        eventsCache.current[cacheKey] = next;
      }
    }

    fetchEvents();
    return () => { cancelled = true; };
  }, [selectedBuilding, idsKey, loading, userId, buildings]);

  useEffect(() => {
    if (buildings.length === 1) {
      setSelectedBuilding(buildings[0].id);
    }
  }, [buildings]);

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

  return (
    <div className="events-page">
      <div className="events-header">
        <h1>Събития</h1>
        <BuildingSelector
          buildings={buildings}
          value={selectedBuilding}
          onChange={setSelectedBuilding}
          singleLabel="Избрана сграда"
        />
      </div>

      {loading ? (
        <p style={{ textAlign: "center", padding: "1rem" }}>Зареждане на събития...</p>
      ) : (
        <table className="events-table">
          <thead>
            <tr>
              <th>№</th>
              <th>Сграда</th>
              <th>Статус</th>
              <th>Тема</th>
              <th>Дата на изпълнение</th>
              <th>Дата на създаване</th>
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
                  <td data-label="Сграда">
                    {event.building?.name}, {event.building?.address}
                  </td>
                  <td data-label="Статус">
                    <span
                      className={(() => {
                        const s = (event.status || "").toString().trim().toLowerCase();
                        if (s === "ново") return "status-badge status-new";
                        if (s === "изпълнено") return "status-badge status-done";
                        return "status-badge";
                      })()}
                    >
                      {event.status}
                    </span>
                  </td>
                  <td data-label="Тема">{event.subject}</td>
                  <td data-label="Дата на изпълнение">{formatDateTime(event.completion_date)}</td>
                  <td data-label="Дата на създаване">{formatDateTime(event.created_at)}</td>
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

