import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "../../supabaseClient"
import "./styles/ReportDetails.css"

function ReportDetails() {

    const { id } = useParams();
    const navigate = useNavigate();
    const [report, setReport] = useState(null);

    useEffect(() => {
        async function fetchReport() {
            const { data, error } = await supabase
                .from("reports")
                .select(`
                id,
                status,
                subject,
                description,
                notes,
                updated_at,
                created_at,
                building:building_id(name,address)
                `)
                .eq("id", id)
                .single();

            if (error) {
                console.error("Supabase error:", error);
            } else {
                setReport(data);
            }
        }
        fetchReport();
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

    if (!report) return <p>Зареждане...</p>

    return (
        <div className="report-details-page">
            <h1>Детайли за подадения сигнал</h1>
            <p><strong>Адрес:</strong> {report.building?.name}, {report.building?.address}</p>
            <p><strong>Състояние:</strong> {report.status}</p>
            <p><strong>Относно:</strong> {report.subject}</p>
            <p><strong>Описание:</strong> {report.description || "-"}</p>
            <p><strong>Дата на добавяне:</strong> {formatDateTime(report.created_at)}</p>
            <p><strong>Дата на обновяване:</strong> {formatDateTime(report.updated_at)}</p>
            <p><strong>Допълнителни бележки:</strong> {report.notes}</p>
            <div className="buttons">
                <button onClick={() => navigate(`/admin/editreport/${report.id}`)}>Редактиране</button>
                <button onClick={() => navigate("/admin/reports")}>Назад към списъка</button>
            </div>
        </div>
    );
}

export default ReportDetails;
