import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import { supabase } from "../supabaseClient";
import ExpenseForecast from "./ai/components/ExpenseForecast";
import { useTheme } from "../components/ThemeContext";
import { useUserBuildings } from "./hooks/UseUserBuildings";
import { useLocalUser } from "./hooks/UseLocalUser";
import "./styles/AdminExpenses.css";

const CountUp = ({ value, duration = 800, decimals = 2 }) => {
  const [displayValue, setDisplayValue] = useState(0);
  useEffect(() => {
    let start = 0;
    let startTime = null;
    let frame;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      const current = start + (value - start) * easeProgress;
      setDisplayValue(current);
      if (progress < 1) frame = requestAnimationFrame(animate);
      else setDisplayValue(value);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);
  return <>{displayValue.toFixed(decimals)}</>;
};

const MONTH_NAMES = {
  1: "Януари", 2: "Февруари", 3: "Март", 4: "Април", 5: "Май", 6: "Юни",
  7: "Юли", 8: "Август", 9: "Септември", 10: "Октомври", 11: "Ноември", 12: "Декември",
};

const EXPENSE_TYPES = {
  electricity_lift: "Ток асансьор",
  fee_lift: "Сервиз асансьор",
  electricity_light: "Ток осветление",
  cleaner: "Хигиенист",
  repair: "Ремонт",
  manager: "Домоуправител",
  water_building: "Вода обща",
  lighting: "Осветление",
  cleaning_supplies: "Консумативи",
  fee_annual_review: "Годишен преглед",
  internet_video: "Интернет/Видео",
  access_control: "Контрол достъп",
  pest_control: "Дезинсекция",
  other: "Други",
};

const CURRENT_YEAR = new Date().getFullYear();

const getYearOptions = () => {
  const years = Array.from({ length: CURRENT_YEAR - 2015 + 2 }, (_, i) => CURRENT_YEAR + 1 - i);
  return [{ value: "all", label: "📅 Всички години" }, ...years.map((y) => ({ value: y, label: `${y} година` }))];
};

const MONTH_OPTIONS = [
  { value: "all", label: "📅 Всички месеци" },
  ...Object.entries(MONTH_NAMES).map(([key, name]) => ({ value: key, label: name })),
];

const getExpenseIcon = (type) => {
  if (!type) return "📝";
  const t = type.toLowerCase();
  if (t.includes("electricity") || t.includes("tok")) return "⚡";
  if (t.includes("lift") || t.includes("asansyor")) return "🛗";
  if (t.includes("water")) return "💧";
  if (t.includes("clean")) return "🧹";
  if (t.includes("repair")) return "🛠️";
  if (t.includes("manager")) return "👨‍💼";
  if (t.includes("lighting")) return "💡";
  if (t.includes("review")) return "📋";
  if (t.includes("internet") || t.includes("video")) return "📡";
  if (t.includes("access") || t.includes("chip")) return "🔑";
  if (t.includes("pest") || t.includes("дезинсекция")) return "🕷️";
  return "📦";
};

const checkIfPaid = (paidValue) => {
    if (paidValue === true) return true;
    if (!paidValue) return false;

    const s = String(paidValue).trim().toLowerCase();
    
    return ["yes", "true", "да", "paid", "y", "1"].includes(s);
};

function AdminExpenses() {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  
  const { userId } = useLocalUser();
  const { buildings, loading: loadingBuildings } = useUserBuildings(userId);

  const [expenses, setExpenses] = useState([]);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [buildingStats, setBuildingStats] = useState({ total: 0, count: 0, maxExpense: null });
  const [loadingStats, setLoadingStats] = useState(false);

  const [selectedBuilding, setSelectedBuilding] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [filterMonth, setFilterMonth] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  const buildingOptions = useMemo(() => {
    const opts = buildings.map(b => ({ value: b.id, label: `${b.name}, ${b.address}` }));
    return [{ value: "all", label: "🏢 Всички сгради" }, ...opts];
  }, [buildings]);

  const selectStyles = useMemo(() => ({
    control: (base, state) => ({
      ...base,
      backgroundColor: isDarkMode ? "#1e293b" : "white",
      borderColor: state.isFocused ? "#3b82f6" : (isDarkMode ? "#334155" : "#e2e8f0"),
      color: isDarkMode ? "#f1f5f9" : "#4a5568",
      borderRadius: "8px",
      minHeight: "42px",
      boxShadow: state.isFocused ? "0 0 0 3px rgba(59, 130, 246, 0.1)" : "none",
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: isDarkMode ? "#1e293b" : "white",
      border: isDarkMode ? "1px solid #334155" : "none",
      zIndex: 9999,
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected 
        ? "#3b82f6" 
        : state.isFocused 
            ? (isDarkMode ? "#334155" : "#eff6ff") 
            : "transparent",
      color: state.isSelected ? "white" : (isDarkMode ? "#f1f5f9" : "#4a5568"),
      cursor: "pointer",
    }),
    singleValue: (base) => ({ ...base, color: isDarkMode ? "#f1f5f9" : "#4a5568" }),
    input: (base) => ({ ...base, color: isDarkMode ? "#f1f5f9" : "#4a5568" }),
    placeholder: (base) => ({ ...base, color: isDarkMode ? "#94a3b8" : "#a0aec0" }),
  }), [isDarkMode]);

  const buildBaseQuery = (selectString, { count } = {}) => {
    let query = supabase.from("expenses").select(selectString, { count });
    if (selectedBuilding !== "all") query = query.eq("building_id", selectedBuilding);
    if (filterYear !== "all") query = query.eq("year", filterYear);
    if (filterMonth !== "all") query = query.eq("month", filterMonth);
    return query;
  };

  useEffect(() => {
    async function fetchExpenses() {
      setLoadingExpenses(true);
      try {
        let query = buildBaseQuery(
          "id, type, month, year, current_month, paid, notes, building:building_id(name,address)",
          { count: "exact" }
        )
          .order("year", { ascending: false })
          .order("month", { ascending: false })
          .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

        const { data, error, count } = await query;
        if (error) throw error;

        setExpenses(data || []);
        setTotalCount(count || 0);
      } catch (err) {
        console.error("Error fetching expenses:", err);
      } finally {
        setLoadingExpenses(false);
      }
    }
    fetchExpenses();
  }, [selectedBuilding, filterYear, filterMonth, currentPage]);

  useEffect(() => {
    async function fetchStats() {
      setLoadingStats(true);
      try {
        const { data, error, count } = await buildBaseQuery("current_month, type", { count: "exact" });
        if (error) throw error;

        const rows = data || [];
        if (rows.length === 0) {
          setBuildingStats({ total: 0, count: 0, maxExpense: null });
          return;
        }
        const total = rows.reduce((sum, r) => sum + Number(r.current_month || 0), 0);
        const maxExpense = rows.reduce((prev, curr) => Number(prev.current_month) > Number(curr.current_month) ? prev : curr);
        setBuildingStats({ total, count: count || rows.length, maxExpense });
      } catch (err) {
        setBuildingStats({ total: 0, count: 0, maxExpense: null });
      } finally {
        setLoadingStats(false);
      }
    }
    fetchStats();
  }, [selectedBuilding, filterYear, filterMonth]);

  const yearOptions = getYearOptions();
  const totalPages = Math.ceil(totalCount / pageSize);
  const getCurrentOption = (options, value) => options.find((o) => String(o.value) === String(value)) || options[0];

  const handleFilterChange = (setter, val) => {
    setter(val);
    setCurrentPage(1);
  };

  return (
    <div className={`admin-expenses-page ${isDarkMode ? "ae-dark" : "ae-light"}`}>
      
      <div className="admin-expenses-header">
        <div className="admin-expenses-left">
          <h1>Разходи</h1>
          <div className="admin-expenses-subheader"><p>Управление и преглед на финансовите отчети</p></div>
        </div>
        <div className="admin-expenses-right">
          <div className="admin-header-select">
            <Select
              className="admin-custom-select"
              options={buildingOptions}
              value={buildingOptions.find(o => o.value === selectedBuilding)}
              onChange={(opt) => {
                setSelectedBuilding(opt ? opt.value : "all");
                setCurrentPage(1);
              }}
              placeholder="Изберете сграда"
              styles={selectStyles}
              isLoading={loadingBuildings}
            />
          </div>
          <button className="admin-add-expense-btn" onClick={() => navigate("/admin/addexpense")}>+ Добави</button>
        </div>
      </div>

      <ExpenseForecast buildingId={selectedBuilding === "all" ? null : selectedBuilding} />

      <div className="admin-stats-container">
        <div className={`admin-stat-card total ${loadingStats ? "updating" : ""}`}>
          <div className="admin-stat-icon">📊</div>
          <div className="admin-stat-content">
            <span className="admin-stat-label">Общо разходи</span>
            <span className="admin-stat-value"><CountUp value={buildingStats.total} decimals={2} /><small>лв.</small></span>
          </div>
        </div>
        <div className={`admin-stat-card count ${loadingStats ? "updating" : ""}`}>
          <div className="admin-stat-icon">🧾</div>
          <div className="admin-stat-content">
            <span className="admin-stat-label">Брой сметки</span>
            <span className="admin-stat-value"><CountUp value={buildingStats.count} decimals={0} /><small>бр.</small></span>
          </div>
        </div>
        <div className={`admin-stat-card max ${loadingStats ? "updating" : ""}`}>
          <div className="admin-stat-icon">🔥</div>
          <div className="admin-stat-content">
            <span className="admin-stat-label">Най-голям разход</span>
            <span className="admin-stat-value">
              <CountUp value={buildingStats.maxExpense ? Number(buildingStats.maxExpense.current_month) : 0} decimals={2} />
              <small>лв.</small>
            </span>
            <span className="admin-stat-subtext">
              {buildingStats.maxExpense ? EXPENSE_TYPES[buildingStats.maxExpense.type] || buildingStats.maxExpense.type : "-"}
            </span>
          </div>
        </div>
      </div>

      <div className="admin-table-toolbar">
        <div className="admin-toolbar-left"><h3>История</h3></div>
        <div className="admin-toolbar-right">
          <div className="admin-select-wrapper">
            <Select
              options={yearOptions}
              value={getCurrentOption(yearOptions, filterYear)}
              onChange={(opt) => handleFilterChange(setFilterYear, opt ? opt.value : "all")}
              styles={selectStyles}
              isSearchable={false}
              placeholder="Година"
            />
          </div>
          <div className="admin-select-wrapper">
            <Select
              options={MONTH_OPTIONS}
              value={getCurrentOption(MONTH_OPTIONS, filterMonth)}
              onChange={(opt) => handleFilterChange(setFilterMonth, opt ? opt.value : "all")}
              styles={selectStyles}
              isSearchable={false}
              placeholder="Месец"
            />
          </div>
        </div>
      </div>

      {loadingExpenses ? (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--ae-text-sec)" }}>
          <span className="loading-spinner">↻</span> Зареждане...
        </div>
      ) : (
        <>
          <table className="admin-expenses-table desktop-view">
            <thead>
              <tr>
                <th>№</th><th>Вид Разход</th><th>Адрес</th><th>Период</th><th>Статус</th><th>Бележка</th><th>Сума</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr><td colSpan="7" className="admin-no-expenses">Няма намерени записи.</td></tr>
              ) : (
                expenses.map((exp, idx) => {
                  const isPaid = checkIfPaid(exp.paid);
                  
                  return (
                    <tr key={exp.id} onClick={() => navigate(`/admin/editexpense/${exp.id}`)} style={{ cursor: "pointer" }}>
                      <td style={{ color: "var(--ae-text-sec)", fontSize: "0.85rem" }}>{(currentPage - 1) * pageSize + idx + 1}</td>
                      <td data-label="Вид">
                        <span className="admin-expense-icon">{getExpenseIcon(exp.type)}</span>
                        {EXPENSE_TYPES[exp.type] || exp.type}
                      </td>
                      <td data-label="Адрес" style={{ fontWeight: 500 }}>{exp.building?.name}, {exp.building?.address}</td>
                      <td data-label="Период">{MONTH_NAMES[exp.month]} {exp.year}</td>
                      <td data-label="Платено">
                        <span className={`admin-status-badge ${isPaid ? "paid" : "unpaid"}`}>
                          {isPaid ? "Платено" : "Неплатено"}
                        </span>
                      </td>
                      <td style={{ color: "var(--ae-text-sec)", fontSize: "0.9rem", fontStyle: "italic" }}>
                        {exp.notes ? (exp.notes.length > 25 ? exp.notes.substring(0, 25) + "..." : exp.notes) : "-"}
                      </td>
                      <td data-label="Сума" className="admin-amount-cell">{Number(exp.current_month).toFixed(2)} лв.</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          <div className="admin-mobile-list mobile-view">
             {expenses.length === 0 ? (
                <div className="admin-no-expenses">Няма намерени записи.</div>
             ) : (
                expenses.map((exp) => {
                   const isPaid = checkIfPaid(exp.paid);
                   
                   return (
                      <div key={exp.id} className="admin-mobile-card" onClick={() => navigate(`/admin/editexpense/${exp.id}`)}>
                          <div className="admin-card-header">
                              <div className="admin-card-type">
                                  <span className="admin-expense-icon">{getExpenseIcon(exp.type)}</span>
                                  <span>{EXPENSE_TYPES[exp.type] || exp.type}</span>
                              </div>
                              <span className={`admin-status-badge small ${isPaid ? "paid" : "unpaid"}`}>
                                {isPaid ? "Платено" : "Неплатено"}
                              </span>
                          </div>
                          
                          <div className="admin-card-address">
                              📍 {exp.building?.name}, {exp.building?.address}
                          </div>

                          <div className="admin-card-footer">
                              <span className="admin-card-date">{MONTH_NAMES[exp.month]} {exp.year}</span>
                              <span className="admin-card-amount">{Number(exp.current_month).toFixed(2)} лв.</span>
                          </div>
                      </div>
                   )
                })
             )}
          </div>

          {totalCount > pageSize && (
            <div className="admin-pagination">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>⬅ Предишна</button>
              <span>Страница {currentPage} от {totalPages || 1}</span>
              <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)}>Следваща ➡</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AdminExpenses;