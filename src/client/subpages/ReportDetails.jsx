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
                .select(`id, status, subject, description, notes, created_at, updated_at, building:building_id(name,address)`)
                .eq("id", id)
                .single();

            if (!error) setReport(data);
        }

        fetchReport();
    }, [id]);

    if (!report) return <p>Зареждане...</p>;

    return (
        <div className="report-details">
            <button onClick={() => navigate(-1)}>← Назад</button>
            <h1>Детайли за подадения сигнал</h1>
            <h3>Относно: {report.subject}</h3>
            <p><strong>Сграда:</strong> {report.building?.name}, {report.building?.address}</p>
            <p><strong>Статус:</strong> {report.status}</p>
            <p><strong>Описание:</strong> {report.description}</p>
            <p><strong>Бележки:</strong> {report.notes || "-"}</p>
            <p><strong>Добавен на:</strong> {new Date(report.created_at).toLocaleString()}</p>
            <p><strong>Актуализиран на:</strong> {new Date(report.updated_at).toLocaleString()}</p>
        </div>
    );
}

export default ReportDetails;
