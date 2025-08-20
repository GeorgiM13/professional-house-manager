import { useState, useEffect } from "react"
import { supabase } from "../supabaseClient"
import "./styles/AdminFees.css"

function AdminFees() {
    const [fees, setFees] = useState([]);
    const [buildings, setBuildings] = useState([]);
    const [selectedBuilding, setSelectedBuilding] = useState("");
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    useEffect(() => {
        fetchBuildings();
    }, []);

    useEffect(() => {
        if(selectedBuilding && selectedMonth && selectedYear) {
            fetchFees(selectedBuilding, selectedMonth, selectedYear);
        }
    }, [selectedBuilding, selectedMonth, selectedYear]);

    const fetchBuildings = async () => {
        const { data, error } = await supabase.from("buildings").select("id, name");
        if (!error) {
            setBuildings(data);
            if(data.length > 0){
                setSelectedBuilding(data[0].id);
            }
        }
    };

    const fetchFees = async (buildingId, month, year) => {
        const { data, error } = await supabase
        .from("fees")
        .select(`
            id,
            object_number,
            type,
            floor,
            current_month_due,
            total_due,
            paid,
            users (
                id,
                first_name,second_name,last_name
            )
        `)
        .eq("building_id", buildingId)
        .eq("month", month)
        .eq("year", year);

        if(!error) setFees(data);
    };

    const months = [
        { value: 1, label: "Януари" },
        { value: 2, label: "Февруари" },
        { value: 3, label: "Март" },
        { value: 4, label: "Април" },
        { value: 5, label: "Май" },
        { value: 6, label: "Юни" },
        { value: 7, label: "Юли" },
        { value: 8, label: "Август" },
        { value: 9, label: "Септември" },
        { value: 10, label: "Октомври" },
        { value: 11, label: "Ноември" },
        { value: 12, label: "Декември" },
    ];

    const years = Array.from({ length: 10 }, (_, i) => new Date(). getFullYear() - i);

    return (

        <div className="fees-page">
            <div className="fees-header">
                <h1>Събиране на такси</h1>
                <div className="building-select">
                    <label>Сграда: </label>
                    <select value={selectedBuilding} onChange={(e) => setSelectedBuilding(e.target.value)}>
                        {buildings.map((b) => (
                            <option key={b.id} value={b.id}>
                                {b.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="month-select">
                    <label>Месец: </label>
                    <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
                        {months.map((m) => (
                            <option key={m.value} value={m.value}>
                                {m.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="year-select">
                    <label>Година: </label>
                    <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
                        {years.map((y) => (
                            <option key={y} value={y}>
                                {y}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            <table className="fees-table">
                <thead>
                    <tr>
                        <th>Обект</th>
                        <th>Вид</th>
                        <th>Етаж</th>
                        <th>Клиент</th>
                        <th>Задължения за текущ месец</th>
                        <th>Задължения общо</th>
                        <th>Статус</th>
                        <th>Действие</th>
                    </tr>
                </thead>
                <tbody>
                    {fees.map((fee) => (
                        <tr key={fee.id}>
                            <td>{fee.object_number}</td>
                            <td>{fee.type}</td>
                            <td>{fee.floor}</td>
                            <td>{fee.client ? `${fee.client.first_name} ${fee.client.second_name} ${fee.client.last_name}` : "-"}</td>
                            <td>{fee.current_month_due.toFixed(2)} лв.</td>
                            <td>{fee.total_due.toFixed(2)} лв.</td>
                            <td>
                                {fee.paid > 0 ? (
                                    <span className="status-badge status-done">Платено</span>
                                ) : (
                                    <span className="status-badge status-new">Неплатено</span>
                                )}
                            </td>
                            <td>
                                <button className="pay-button">
                                    Плати с карта
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

    );

}

export default AdminFees;