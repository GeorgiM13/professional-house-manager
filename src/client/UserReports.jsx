import { useState, useEffect, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import { supabase } from "../supabaseClient"
import "./styles/UserReports.css"

function UserReports() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user"));
    const [reports, setReports] = useState([]);
    const [buildings, setBuildings] = useState([]);
    const [loadingBuildings, setLoadingBuildings] = useState(true);
    const [selectedBuilding, setSelectedBuilding] = useState("all");

    const reportsCache = useRef({});
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
        async function fetchReports() {
            if (!user || loadingBuildings) return;

            const cacheKey = selectedBuilding;

            if (reportsCache.current[cacheKey]) {
                setReports(reportsCache.current[cacheKey]);
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
                .eq("submitted_by", user.id)
                .order("created_at", { ascending: false });

            if (selectedBuilding !== "all") {
                query = query.eq("building_id", selectedBuilding);
            } else if (buildings.length > 0) {
                query = query.in(
                    "building_id",
                    buildings.map((b) => b.id)
                );
            }

            const { data, error } = await query;
            if (!error) {
                setReports(data || []);
                reportsCache.current[cacheKey] = data || [];
            }
        }

        fetchReports();
    }, [user, selectedBuilding, buildings, loadingBuildings]);

    function formatDateTime(dateString) {
        if (!dateString) return "";
        const date = new Date(dateString);
        return `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}.${date.getFullYear()}  ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    }

    useEffect(() => {
        if (buildings.length === 1) {
            setSelectedBuilding(buildings[0].id);
        }
    }, [buildings]);

    return (
        <div className="reports-page">
            <h1>Моите сигнали</h1>

            <div className="reports-header">

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
                            <th>Добавен на</th>
                            <th>Актуализиран на</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reports.map((report, idx) => (
                            <tr key={report.id}
                                onClick={() => navigate(`/client/report/${report.id}`)} style={{ cursor: "pointer" }}>
                                <td>{idx + 1}</td>
                                <td>{report.building?.name}, {report.building?.address}</td>
                                <td><span className={
                                    report.status === "ново"
                                        ? "status-badge status-new"
                                        : report.status === "изпълнено"
                                            ? "status-badge status-done"
                                            : "status-badge"
                                }>
                                    {report.status}
                                </span></td>
                                <td>{report.subject}</td>
                                <td>
                                    {report.description.length > 50
                                        ? report.description.slice(0, 50) + "..."
                                        : report.description
                                    }
                                </td>
                                <td>{formatDateTime(report.created_at)}</td>
                                <td>{formatDateTime(report.updated_at)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default UserReports;
