import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useUserBuildings } from "./hooks/useUserBuildings";
import { useLocalUser } from "./hooks/useLocalUser";
import BuildingSelector from "./components/BuildingSelector";
import "./styles/UserExpenses.css";

function UserExpenses() {
  const navigate = useNavigate();
  const { userId } = useLocalUser();
  const [expenses, setExpenses] = useState([]);
  const { buildings, loading } = useUserBuildings(userId);
  const [selectedBuilding, setSelectedBuilding] = useState("all");
  const expensesCache = useRef({});

  const idsKey = useMemo(
    () => (buildings.length ? buildings.map((b) => b.id).sort().join(",") : ""),
    [buildings]
  );

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
    12: "Декември",
  };

  useEffect(() => {
    if (!userId || loading) return;
    if (buildings.length === 0) return;

    async function fetchExpenses() {
      if (!userId || loading) return;

      const cacheKey = `${selectedBuilding}|${idsKey}`;
      const cached = expensesCache.current[cacheKey];
      if (cached) {
        setExpenses(cached);
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
        console.error("Supabase error (expenses):", error);
      } else {
        const next = data || [];
        setExpenses(next);
        expensesCache.current[cacheKey] = next;
      }
    }

    fetchExpenses();
  }, [selectedBuilding, idsKey, loading, userId, buildings]);

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
        <h1>Разходи</h1>
        <BuildingSelector
          buildings={buildings}
          value={selectedBuilding}
          onChange={setSelectedBuilding}
          singleLabel="Избрана сграда"
        />
      </div>

      {loading ? (
        <p style={{ textAlign: "center", padding: "1rem" }}>Зареждане на разходи...</p>
      ) : (
        <table className="expenses-table">
          <thead>
            <tr>
              <th>№</th>
              <th>Тип разход</th>
              <th>Сграда</th>
              <th>Месец</th>
              <th>Година</th>
              <th>Платено</th>
              <th>Сума</th>
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-expenses">Няма разходи.</td>
              </tr>
            ) : (
              expenses.map((exp, idx) => {
                const paid = `${exp.paid ?? ""}`.toLowerCase();
                const isPaid = paid === "да" || paid === "yes" || paid === "true" || exp.paid === true;
                return (
                  <tr
                    key={exp.id}
                    onClick={() => navigate(`/client/expense/${exp.id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <td data-label="№">{idx + 1}</td>
                    <td data-label="Тип разход">{expenseTypes[exp.type] || exp.type}</td>
                    <td data-label="Сграда">{exp.building?.name}, {exp.building?.address}</td>
                    <td data-label="Месец">{monthNames[exp.month]}</td>
                    <td data-label="Година">{exp.year}</td>
                    <td data-label="Платенос">
                      <span className={isPaid ? "status-badge status-paid" : "status-badge status-unpaid"}>
                        {isPaid ? "Да" : "Не"}
                      </span>
                    </td>
                    <td data-label="Текущ месец">{exp.current_month} лв</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default UserExpenses;

