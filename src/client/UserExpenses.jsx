import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../supabaseClient"
import { useUserBuildings } from "./hooks/useUserBuildings"
import "./styles/UserExpenses.css"

function UserExpenses() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user"));
    const [expenses, setExpenses] = useState([]);
    const { buildings, loading } = useUserBuildings(user?.id);
    const [selectedBuilding, setSelectedBuilding] = useState("all");
    const expensesCache = useRef({});
    const buildingCache = useRef({});

    const monthNames = {
    1: "Януари",
    2: "Февруари",
    3: "Март",
    4: "Април",
    5: "Май",
    6: "Юни",
    7: "Юли",
    8: "Август",
    9: "Септември",
    10: "Октомври",
    11: "Ноември",
    12: "Декември"
  };

    useEffect(() => {
        if (!user || loading) return;
        if (buildings.length === 0) return; 

        async function fetchExpenses() {
            if (!user || loading) return;

            const cacheKey = selectedBuilding;
            if (expensesCache.current[cacheKey]) {
                setExpenses(expensesCache.current[cacheKey]);
                return;
            }

            let query = supabase
                .from("expenses")
                .select(`
                    id,
                    type,
                    month,
                    year,
                    current_month,
                    paid,
                    notes,
                    building:building_id(name,address)
                `)
                .order("year", { ascending: false })
                .order("month", { ascending: false });

            if (selectedBuilding !== "all") {
                query = query.eq("building_id", selectedBuilding);
            } else if (buildings.length > 0) {
                query = query.in("building_id", buildings.map((b) => b.id));
            }

            const { data, error } = await query;
            if (error) {
                console.error("Грешка при зареждане на разходи:", error);
            } else {
                setExpenses(data || []);
                expensesCache.current[cacheKey] = data || [];
            }
        }

        fetchExpenses();
    }, [selectedBuilding, loading]);

    useEffect(() => {
        if (buildings.length === 1) {
            setSelectedBuilding(buildings[0].id);
        }
    }, [buildings]);

    const expenseTypes = {
        electricity_lift: "Ток асансьор",
        fee_lift: "Сервиз асансьор",
        electricity_light: "Ток осветление",
        cleaner: "Хигиенист",
        other: "Други",
    };

    return (
        <div className="expenses-page">
            <div className="expenses-header">
                <h1>Разходи на блока</h1>
                {buildings.length === 1 && buildings[0] ? (
                    <>
                        <div className="building-badge">
                            <p className="building-label">Вашата сграда: </p>
                            <p className="building-info">
                                {buildings[0].name} – {buildings[0].address}
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

            {loading ? (
                <p style={{ textAlign: "center", padding: "1rem" }}>Зареждане на разходи...</p>
            ) : (
                <table className="expenses-table">
                    <thead>
                        <tr>
                            <th>№</th>
                            <th>Вид</th>
                            <th>Адрес</th>
                            <th>Месец</th>
                            <th>Година</th>
                            <th>Платено</th>
                            <th>Сума</th>
                        </tr>
                    </thead>
                    <tbody>
                        {expenses.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="no-expenses">
                                    Нямате разходи.
                                </td>
                            </tr>
                        ) : (
                            expenses.map((exp, idx) => (
                                <tr key={exp.id}
                                    onClick={() => navigate(`/client/expense/${exp.id}`)} style={{ cursor: "pointer" }}>
                                    <td data-label="№">{idx + 1}</td>
                                    <td data-label="Тип разход">{expenseTypes[exp.type] || exp.type}</td>
                                    <td data-label="Адрес">{exp.building?.name}, {exp.building?.address}</td>
                                    <td data-label="Месец">{monthNames[exp.month]}</td>
                                    <td data-label="Година">{exp.year}</td>
                                    <td data-label="Платено">
                                        <span
                                            className={
                                                exp.paid === "да"
                                                    ? "status-badge status-paid"
                                                    : "status-badge status-unpaid"
                                            }
                                        >
                                            {exp.paid === "да" ? "Да" : "Не"}
                                        </span>
                                    </td>
                                    <td data-label="Сума">{exp.current_month} лв</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default UserExpenses;
