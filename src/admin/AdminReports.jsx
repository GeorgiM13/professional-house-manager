import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import AsyncSelect from "react-select/async"
import { supabase } from "../supabaseClient"
import "./styles/AdminReports.css"

function AdminReports() {

    const navigate = useNavigate();
    const [selectedBuilding, setSelectedBuilding] = useState("all");
    const [reports, setReports] = useState([]);
    const [showPastReports, setShowPastReports] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const pageSize = 20;


    const loadBuildings = async (inputValue) => {
        const { data } = await supabase
            .from("buildings")
            .select("id, name, address")
            .ilike("name", `%${inputValue || ""}%`)
            .limit(10);
        return data.map(b => ({ value: b.id, label: `${b.name}, ${b.address}` }));
    };

    useEffect(() => {
        async function fetchReports() {
            const from = (currentPage - 1) * pageSize;
            const to = from + pageSize - 1;

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
                `, { count: "exact" }
                )
                .order("created_at", { ascending: false })
                .range(from,to);

            if (!showPastReports) {
                query = query.eq("status", "ново");
            }

            if (selectedBuilding !== "all") {
                query = query.eq("building_id", selectedBuilding);
            }

            const { data, error, count } = await query;
            if (error) console.error("Supabase error:", error);
            else {
                setReports(data || []);
                setTotalCount(count || 0);
            }
        }
        fetchReports();
    }, [selectedBuilding, currentPage, pageSize, showPastReports]);

    useEffect(() => {
        setCurrentPage(1);
    }, [showPastReports]);

    const totalPages = Math.ceil(totalCount / pageSize);

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
                <AsyncSelect
                    className="custom-select"
                    classNamePrefix="custom"
                    cacheOptions
                    defaultOptions
                    loadOptions={loadBuildings}
                    onChange={(option) => {
                        setSelectedBuilding(option ? option.value : "all");
                    }}
                    placeholder="Изберете сграда"
                    isClearable
                />
            </div>
            

            <div className="reports-subheader">
                <div className="left">
                    <span>Сигнали, подадени от потребители</span>
                    <p>Преглед на всички подадени сигнали</p>
                </div>
            </div>

            <div className="reports-filter">
                <label className="toggle-switch">
                    <input
                        type="checkbox"
                        checked={showPastReports}
                        onChange={() => setShowPastReports(!showPastReports)}
                    />
                    <span className="slider"></span>
                    <span className="label-text">Показвай минали сигнали</span>
                </label>
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

export default AdminReports;
