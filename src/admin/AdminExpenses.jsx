import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import AsyncSelect from "react-select/async"
import { supabase } from "../supabaseClient"
import ExpenseForecast from "./ai/components/ExpenseForecast"
import "./styles/AdminExpenses.css"

function AdminExpenses() {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

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
        .select("*, building:buildings(name,address)", { count: "exact" })
        .order("year", { ascending: false })
        .order("month", { ascending: false })
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

      if (selectedBuilding !== "all") {
        query = query.eq("building_id", selectedBuilding);
      }

      const { data: expensesData, error, count } = await query;

      if (error) {
        console.error("Грешка при зареждане на разходите:", error);
        return;
      }

      setExpenses(expensesData || []);
      setTotalCount(count || 0);
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
    repair: "Ремонт",
    manager: "Домоуправител",
    water_building: "Вода обща",
    lighting: "Осветление",
    cleaning_supplies: "Консумативи за почистване",
    fee_annual_review: "Годишен преглед асансьор",
    internet_video: "Интернет/Видеонаблюдение",
    access_control: "Контрол на достъп",
    pest_control: "Дезинсекция",
    other: "Други",
  };

  const getExpenseIcon = (type) => {
    if (!type) return '📝';
    const t = type.toLowerCase();
    if (t.includes('electricity') || t.includes('tok')) return '⚡';
    if (t.includes('lift') || t.includes('asansyor')) return '🛗';
    if (t.includes('water')) return '💧';
    if (t.includes('clean')) return '🧹';
    if (t.includes('repair')) return '🛠️';
    if (t.includes('manager')) return '👨‍💼';
    if (t.includes('lighting')) return '💡';
    if (t.includes('review')) return '📋';
    if (t.includes('internet') || t.includes('video')) return '📡';
    if (t.includes('Дезинсекция') || t.includes('pest')) return '🕷️';
    if (t.includes('access') || t.includes('chip')) return '🔑';
    return '📦';
  };

  return (
    <div className="expenses-page">
      <div className="expenses-header">
        <div className="expenses-left">
          <h1>Разходи</h1>
          <div className="expenses-subheader">
            <p>Управление и преглед на финансовите отчети</p>
          </div>
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
              setCurrentPage(1);
            }}
            placeholder="Изберете сграда"
            isClearable
          />

          <button className="add-expense-btn" onClick={() => navigate("/admin/addexpense")}>
            + Добави разход
          </button>
        </div>
      </div>

      <ExpenseForecast buildingId={selectedBuilding} />

      

      <table className="expenses-table">
        <thead>
          <tr>
            <th>№</th>
            <th>Вид Разход</th>
            <th>Адрес</th>
            <th>Период</th>
            <th>Статус</th>
            <th>Бележка</th>
            <th>Сума</th>
          </tr>
        </thead>
        <tbody>
          {expenses.length === 0 ? (
            <tr>
              <td colSpan="7" className="no-expenses">
                Няма намерени записи.
              </td>
            </tr>
          ) : (
            expenses.map((exp, idx) => (
              <tr
                key={exp.id}
                onClick={() => navigate(`/admin/editexpense/${exp.id}`)}
                style={{ cursor: "pointer" }}
              >
                <td style={{ color: '#999', fontSize: '0.85rem' }}>
                   {(currentPage - 1) * pageSize + idx + 1}
                </td>
                
                <td data-label="Вид">
                  <span className="expense-icon">{getExpenseIcon(exp.type)}</span>
                  {expenseTypes[exp.type] || exp.type}
                </td>
                
                <td data-label="Адрес" style={{ fontWeight: 500 }}>
                  {exp.building?.name}, {exp.building?.address}
                </td>
                
                <td data-label="Период">
                  {monthNames[exp.month]} {exp.year}
                </td>
                
                <td data-label="Платено">
                  <span
                    className={
                      exp.paid === "да"
                        ? "status-badge-expenses status-paid-expenses"
                        : "status-badge-expenses status-unpaid-expenses"
                    }
                  >
                    {exp.paid === "да" ? "Платено" : "Неплатено"}
                  </span>
                </td>

                <td style={{ color: '#666', fontSize: '0.9rem', fontStyle: 'italic' }}>
                    {exp.notes ? (exp.notes.length > 25 ? exp.notes.substring(0, 25) + '...' : exp.notes) : '-'}
                </td>
                
                <td data-label="Сума" className="amount-cell">
                  {Number(exp.current_month).toFixed(2)} лв.
                </td>
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
        <span>Страница {currentPage} от {totalPages || 1}</span>
        <button
          disabled={currentPage >= totalPages}
          onClick={() => setCurrentPage(p => p + 1)}
        >
          Следваща ➡
        </button>
      </div>
    </div>
  );
}

export default AdminExpenses;
