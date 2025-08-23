import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../supabaseClient"
import "./styles/AdminExpenses.css"

function AdminExpenses() {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState("all");

  const monthOrder = {
    "Януари": 1,
    "Февруари": 2,
    "Март": 3,
    "Април": 4,
    "Май": 5,
    "Юни": 6,
    "Юли": 7,
    "Август": 8,
    "Септември": 9,
    "Октомври": 10,
    "Ноември": 11,
    "Декември": 12
  };

  useEffect(() => {
    async function fetchData() {
      const { data: expensesData, error: expensesError } = await supabase
        .from("expenses")
        .select(`*, building:buildings(name,address)`);

      if (expensesError) {
        console.error("Грешка при зареждане на разходите:", expensesError);
      } else {
        const sortedExpenses = [...(expensesData || [])].sort((a, b) => {
          if (b.year !== a.year) return b.year - a.year;
          return monthOrder[b.month] - monthOrder[a.month];
        });
        setExpenses(sortedExpenses);
      }

      const { data: buildingsData, error: buildingsError } = await supabase
        .from("buildings")
        .select("*")
        .order("name");

      if (buildingsError) {
        console.error("Грешка при зареждане на сградите:", buildingsError);
      } else {
        setBuildings(buildingsData || []);
      }
    }

    fetchData();
  }, []);

  const filteredExpenses =
    selectedBuilding === "all"
      ? expenses
      : expenses.filter((exp) => exp.building_id === Number(selectedBuilding));

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
        <div className="expenses-left">
          <h1>Разходи</h1>
        </div>
        <div className="expenses-right">
          <select
            value={selectedBuilding}
            onChange={(e) => setSelectedBuilding(e.target.value)}
          >
            <option value="all">Всички сгради</option>
            {buildings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          <button className="add-expense-btn" onClick={() => navigate("/admin/addexpense")}>
            Добавяне на разход
          </button>
        </div>
      </div>
      <div className="reports-subheader">
        <div className="left">
          <span>Разходи, свързани със сгради</span>
          <p>Преглед на всички разходи</p>
        </div>
      </div>
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
          {filteredExpenses.length === 0 ? (
            <tr>
              <td colSpan="7" className="no-expenses">
                Няма добавени разходи.
              </td>
            </tr>
          ) : (
            filteredExpenses.map((exp, idx) => (
              <tr
                key={exp.id}
                onClick={() => navigate(`/admin/editexpense/${exp.id}`)}
                style={{ cursor: "pointer" }}
              >
                <td>{idx + 1}</td>
                <td>{expenseTypes[exp.type] || exp.type}</td>
                <td>
                  {exp.building?.name}, {exp.building?.address}
                </td>
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
    </div>
  );
}

export default AdminExpenses;
