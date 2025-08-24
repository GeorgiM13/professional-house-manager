import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../supabaseClient"
import "./styles/AdminReports.css"

function AdminReports() {
    const navigate = useNavigate();
    const [buildings, setBuildings] = useState([]);
    const [selectedBuilding, setSelectedBuilding] = useState("all");
    const [reports, setReports] = useState([]);

    useEffect(() => {
        async function fetchBuildings() {
            const { data } = await supabase.from("buildings").select("*");
            setBuildings(data || []);
        }
        fetchBuildings();
    }, []);

    useEffect(() => {
        async function fetchReports() {
            let query = supabase
                .from("reports")
                .select(`
                    id,
                    status,
                    subject,
                    updated_at,
                    created_at,
                    building:building_id(name,address),
                    submitted_by(first_name,second_name,last_name)
                `)
                .order("created_at", { ascending: false });

            if (selectedBuilding !== "all") {
                query = query.eq("building_id", selectedBuilding);
            }

            const { data, error } = await query;
            if (error) console.error("Supabase error:", error);
            setReports(data || []);
        }
        fetchReports();
    }, [selectedBuilding]);

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
        <div className="reports-page">
            <div className="reports-header">
                <h1>Подадени сигнали</h1>
                <select value={selectedBuilding} onChange={(e) => setSelectedBuilding(e.target.value)}>
                    <option value="all">Всички сгради</option>
                    {buildings.map((building) => (
                        <option key={building.id} value={building.id}>{building.name}</option>
                    ))}
                </select>
            </div>

            <div className="reports-subheader">
                <div className="left">
                    <span>Сигнали, подадени от потребители</span>
                    <p>Преглед на всички подадени сигнали</p>
                </div>
            </div>

            <table className="reports-table">
                <thead>
                    <tr>
                        <th>№</th>
                        <th>Адрес</th>
                        <th>Състояние</th>
                        <th>Относно</th>
                        <th>Дата на обновяване</th>
                        <th>Дата на подаване</th>
                        <th>Подал сигнал</th>
                    </tr>
                </thead>
                <tbody>
                    {reports.map((report, idx) => (
                        <tr key={report.id}
                            onClick={() => navigate(`/admin/report/${report.id}`)}
                            style={{ cursor: "pointer" }}>
                            <td data-label="№">{idx + 1}</td>
                            <td data-label="Адрес">{report.building?.name}, {report.building?.address}</td>
                            <td data-label="Състояние">
                                <span className={
                                    report.status === "ново"
                                        ? "status-badge status-new"
                                        : report.status === "изпълнено"
                                            ? "status-badge status-done"
                                            : "status-badge"
                                }>
                                    {report.status}
                                </span>
                            </td>
                            <td data-label="Относно">{report.subject}</td>
                            <td data-label="Дата на обновяване">{formatDateTime(report.updated_at)}</td>
                            <td data-label="Дата на подаване">{formatDateTime(report.created_at)}</td>
                            <td data-label="Подал сигнал">{report.submitted_by ? `${report.submitted_by.first_name} ${report.submitted_by.second_name} ${report.submitted_by.last_name}` : "-"}</td>
                        </tr>
                    ))}
                </tbody>

            </table>
        </div>
    );
}

export default AdminReports;
