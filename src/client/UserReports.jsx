import { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useUserBuildings } from "./hooks/useUserBuildings";
import { useLocalUser } from "./hooks/useLocalUser";
import BuildingSelector from "./components/BuildingSelector";
import { formatDateTime } from "../utils/dates";
import "./styles/UserReports.css";

function UserReports() {
  const navigate = useNavigate();
  const { userId } = useLocalUser();
  const [reports, setReports] = useState([]);
  const { buildings, loading } = useUserBuildings(userId);
  const [selectedBuilding, setSelectedBuilding] = useState("all");
  const reportsCache = useRef({});

  const idsKey = useMemo(
    () => (buildings.length ? buildings.map((b) => b.id).sort().join(",") : ""),
    [buildings]
  );

  useEffect(() => {
    let cancelled = false;
    async function fetchReports() {
      if (!userId || loading) return;

      const cacheKey = `${userId}|${selectedBuilding}|${idsKey}`;
      const cached = reportsCache.current[cacheKey];
      if (cached) {
        setReports(cached);
        return;
      }

      let query = supabase
        .from("reports")
        .select(`
          id,
          status,
          subject,
          description,
          notes,
          created_at,
          updated_at,
          building_id,
          building:building_id(name,address)
        `)
        .eq("submitted_by", userId)
        .order("created_at", { ascending: false });

      if (selectedBuilding !== "all") {
        query = query.eq("building_id", selectedBuilding);
      } else if (buildings.length > 0) {
        query = query.in("building_id", buildings.map((b) => b.id));
      }

      const { data, error } = await query;
      if (!cancelled && !error) {
        const next = data || [];
        setReports(next);
        reportsCache.current[cacheKey] = next;
      }
    }

    fetchReports();
    return () => {
      cancelled = true;
    };
  }, [userId, selectedBuilding, idsKey, loading, buildings]);

  useEffect(() => {
    if (buildings.length === 1) {
      setSelectedBuilding(buildings[0].id);
    }
  }, [buildings]);

  return (
    <div className="reports-page">
      <h1>Сигнали</h1>

      <div className="reports-header">
        <BuildingSelector
          buildings={buildings}
          value={selectedBuilding}
          onChange={setSelectedBuilding}
          singleLabel="Избрана сграда"
        />

        <Link to="/client/addreport">
          <button>Подай нов сигнал</button>
        </Link>
      </div>

      {reports.length === 0 ? (
        <p style={{ textAlign: "center", padding: "1rem" }}>Няма подадени сигнали.</p>
      ) : (
        <table className="reports-table">
          <thead>
            <tr>
              <th>№</th>
              <th>Сграда</th>
              <th>Статус</th>
              <th>Относно</th>
              <th>Описание</th>
              <th>Създаден на</th>
              <th>Обновен на</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report, idx) => (
              <tr
                key={report.id}
                onClick={() => navigate(`/client/report/${report.id}`)}
                style={{ cursor: "pointer" }}
              >
                <td data-label="№">{idx + 1}</td>
                <td data-label="Сграда">{report.building?.name}, {report.building?.address}</td>
                <td data-label="Статус">
                  <span
                    className={(() => {
                      const s = (report.status || "").toString().trim().toLowerCase();
                      if (s === "ново") return "status-badge status-new";
                      if (s === "изпълнено") return "status-badge status-done";
                      return "status-badge";
                    })()}
                  >
                    {report.status}
                  </span>
                </td>
                <td data-label="Относно">{report.subject}</td>
                <td data-label="Описание">
                  {report.description.length > 50
                    ? report.description.slice(0, 50) + "..."
                    : report.description}
                </td>
                <td data-label="Създаден на">{formatDateTime(report.created_at)}</td>
                <td data-label="Обновен на">{formatDateTime(report.updated_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default UserReports;

