import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import AsyncSelect from "react-select/async"
import { supabase } from "../supabaseClient"
import "./styles/AdminExpenses.css"

function AdminExpenses() {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

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

  const loadBuildings = async (inputValue) => {
    const { data } = await supabase
      .from("buildings")
      .select("id, name, address")
      .ilike("name", `%${inputValue || ""}%`)
      .limit(10);
    return data.map(b => ({ value: b.id, label: `${b.name}, ${b.address}` }));
  };

  useEffect(() => {
    async function fetchExpenses() {
      let query = supabase
        .from("expenses")
        .select(`*, building:buildings(name,address)`);

      if (selectedBuilding !== "all") {
        query = query.eq("building_id", selectedBuilding);
      }

      const { data: expensesData, error: expensesError } = await query;

      if (expensesError) {
        console.error("Грешка при зареждане на разходите:", expensesError);
        return;
      }

      const sortedExpenses = [...(expensesData || [])].sort((a, b) => {
        if (b.year !== a.year) return b.year - a.year;
        return monthOrder[b.month] - monthOrder[a.month];
      });

      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize;
      const pagedExpenses = sortedExpenses.slice(from, to);

      setExpenses(pagedExpenses);
      setTotalCount(sortedExpenses.length);
    }

    fetchExpenses();
  }, [currentPage, pageSize, selectedBuilding]);

  const filteredExpenses =
    selectedBuilding === "all"
      ? expenses
      : expenses.filter((exp) => exp.building_id === Number(selectedBuilding));

  const totalPages = Math.ceil(totalCount / pageSize);

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
                <td data-label="№">{idx + 1}</td>
                <td data-label="Вид">{expenseTypes[exp.type] || exp.type}</td>
                <td data-label="Адрес">
                  {exp.building?.name}, {exp.building?.address}
                </td>
                <td data-label="Месец">{exp.month}</td>
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

export default AdminExpenses;
