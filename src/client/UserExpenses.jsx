import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../supabaseClient"
import "./styles/UserExpenses.css"

function UserExpenses() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user"));
    const [expenses, setExpenses] = useState([]);
    const [buildings, setBuildings] = useState([]);
    const [loadingBuildings, setLoadingBuildings] = useState(true);
    const [selectedBuilding, setSelectedBuilding] = useState("all");
    const expensesCache = useRef({});
    const buildingCache = useRef({});

    const monthOrder = {
        "Януари": 1, "Февруари": 2, "Март": 3, "Април": 4,
        "Май": 5, "Юни": 6, "Юли": 7, "Август": 8,
        "Септември": 9, "Октомври": 10, "Ноември": 11, "Декември": 12
    };

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
        async function fetchExpenses() {
            if (!user || loadingBuildings) return;

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
                .order("year", { ascending: false });

            if (selectedBuilding !== "all") {
                query = query.eq("building_id", selectedBuilding);
            } else if (buildings.length > 0) {
                query = query.in("building_id", buildings.map((b) => b.id));
            }

            const { data, error } = await query;
            if (error) {
                console.error("Грешка при зареждане на разходи:", error);
            } else {
                const sorted = [...(data || [])].sort((a, b) => {
                    if (b.year !== a.year) return b.year - a.year;
                    return monthOrder[b.month] - monthOrder[a.month];
                });
                setExpenses(sorted);
                expensesCache.current[cacheKey] = sorted;
            }
        }

        fetchExpenses();
    }, [user, selectedBuilding, buildings, loadingBuildings]);

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

            {loadingBuildings ? (
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
                                    <td>{idx + 1}</td>
                                    <td>{expenseTypes[exp.type] || exp.type}</td>
                                    <td>{exp.building?.name}, {exp.building?.address}</td>
                                    <td>{exp.month}</td>
                                    <td>{exp.year}</td>
                                    <td>
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
                                    <td>{exp.current_month} лв</td>
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
