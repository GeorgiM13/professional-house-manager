import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AsyncSelect from "react-select/async";
import Select from "react-select";
import { supabase } from "../supabaseClient";
import ExpenseForecast from "./ai/components/ExpenseForecast";
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

      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return <>{displayValue.toFixed(decimals)}</>;
};

const MONTH_NAMES = {
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

const EXPENSE_TYPES = {
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

const CUSTOM_SELECT_STYLES = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: "white",
    borderColor: state.isFocused ? "#3b82f6" : "#e2e8f0",
    borderRadius: "8px",
    boxShadow: state.isFocused
      ? "0 0 0 3px rgba(59, 130, 246, 0.1)"
      : "0 1px 2px rgba(0, 0, 0, 0.05)",
    "&:hover": { borderColor: "#cbd5e0" },
    minWidth: "160px",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: "500",
    color: "#4a5568",
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "#3b82f6"
      : state.isFocused
      ? "#eff6ff"
      : "white",
    color: state.isSelected ? "white" : "#4a5568",
    cursor: "pointer",
    fontSize: "0.9rem",
    padding: "8px 12px",
  }),
  menu: (provided) => ({
    ...provided,
    borderRadius: "8px",
    zIndex: 9999,
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
  }),
  indicatorSeparator: () => ({ display: "none" }),
};

const CURRENT_YEAR = new Date().getFullYear();

const getYearOptions = () => {
  const years = Array.from(
    { length: CURRENT_YEAR - 2015 + 2 },
    (_, i) => CURRENT_YEAR + 1 - i
  );
  return [
    { value: "all", label: "📅 Всички години" },
    ...years.map((y) => ({ value: y, label: `${y} година` })),
  ];
};

const MONTH_OPTIONS = [
  { value: "all", label: "📅 Всички месеци" },
  ...Object.entries(MONTH_NAMES).map(([key, name]) => ({
    value: key,
    label: name,
  })),
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

function AdminExpenses() {
  const navigate = useNavigate();

  const [expenses, setExpenses] = useState([]);
  const [loadingExpenses, setLoadingExpenses] = useState(false);

  const [buildingStats, setBuildingStats] = useState({
    total: 0,
    count: 0,
    maxExpense: null,
  });
  const [loadingStats, setLoadingStats] = useState(false);

  const [selectedBuilding, setSelectedBuilding] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [filterMonth, setFilterMonth] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  const loadBuildings = async (inputValue) => {
    const { data } = await supabase
      .from("buildings")
      .select("id, name, address")
      .ilike("name", `%${inputValue || ""}%`)
      .limit(10);

    return (data || []).map((b) => ({
      value: b.id,
      label: `${b.name}, ${b.address}`,
    }));
  };

  const buildBaseQuery = (selectString, { count } = {}) => {
    let query = supabase.from("expenses").select(selectString, { count });

    if (selectedBuilding !== "all") {
      query = query.eq("building_id", selectedBuilding);
    }

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
          .range(
            (currentPage - 1) * pageSize,
            currentPage * pageSize - 1
          );

        const { data, error, count } = await query;

        if (error) {
          console.error("Грешка при зареждане на разходите:", error);
          setExpenses([]);
          setTotalCount(0);
          return;
        }

        setExpenses(data || []);
        setTotalCount(count || 0);
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
        const { data, error, count } = await buildBaseQuery(
          "current_month, type",
          { count: "exact" }
        );

        if (error) {
          console.error("Грешка при статистиките:", error);
          setBuildingStats({ total: 0, count: 0, maxExpense: null });
          return;
        }

        const rows = data || [];
        if (rows.length === 0) {
          setBuildingStats({ total: 0, count: 0, maxExpense: null });
          return;
        }

        const total = rows.reduce(
          (sum, r) => sum + Number(r.current_month || 0),
          0
        );

        const maxExpense = rows.reduce((prev, curr) =>
          Number(prev.current_month) > Number(curr.current_month)
            ? prev
            : curr
        );

        setBuildingStats({
          total,
          count: count || rows.length,
          maxExpense,
        });
      } finally {
        setLoadingStats(false);
      }
    }

    fetchStats();
  }, [selectedBuilding, filterYear, filterMonth]);

  const yearOptions = getYearOptions();
  const totalPages = Math.ceil(totalCount / pageSize);

  const getCurrentOption = (options, value) =>
    options.find((o) => String(o.value) === String(value)) || options[0];

  const handleFilterChange = (setter, val) => {
    setter(val);
    setCurrentPage(1);
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

          <button
            className="add-expense-btn"
            onClick={() => navigate("/admin/addexpense")}
          >
            + Добави разход
          </button>
        </div>
      </div>

      <ExpenseForecast buildingId={selectedBuilding} />

      <div className="building-stats-container">
        <div className={`b-stat-card total ${loadingStats ? "updating" : ""}`}>
          <div className="b-stat-icon-wrapper">📊</div>
          <div className="b-stat-content">
            <span className="b-stat-label">Общо разходи</span>
            <span className="b-stat-value">
              <CountUp value={buildingStats.total} decimals={2} />
              <small>лв.</small>
            </span>
          </div>
        </div>

        <div className={`b-stat-card count ${loadingStats ? "updating" : ""}`}>
          <div className="b-stat-icon-wrapper">🧾</div>
          <div className="b-stat-content">
            <span className="b-stat-label">Брой сметки</span>
            <span className="b-stat-value">
              <CountUp value={buildingStats.count} decimals={0} />
              <small>бр.</small>
            </span>
          </div>
        </div>

        <div className={`b-stat-card max ${loadingStats ? "updating" : ""}`}>
          <div className="b-stat-icon-wrapper">🔥</div>
          <div className="b-stat-content">
            <span className="b-stat-label">Най-голям разход</span>
            <span className="b-stat-value">
              <CountUp
                value={
                  buildingStats.maxExpense
                    ? Number(buildingStats.maxExpense.current_month)
                    : 0
                }
                decimals={2}
              />
              <small>лв.</small>
            </span>
            <span className="b-stat-subtext">
              {buildingStats.maxExpense
                ? EXPENSE_TYPES[buildingStats.maxExpense.type] ||
                  buildingStats.maxExpense.type
                : "-"}
            </span>
          </div>
        </div>
      </div>

      <div className="table-toolbar">
        <div className="toolbar-left">
          <h3>История на разходите</h3>
        </div>
        <div className="toolbar-right">
          <div style={{ width: "180px" }}>
            <Select
              options={yearOptions}
              value={getCurrentOption(yearOptions, filterYear)}
              onChange={(opt) =>
                handleFilterChange(setFilterYear, opt ? opt.value : "all")
              }
              styles={CUSTOM_SELECT_STYLES}
              isSearchable={false}
              placeholder="Година"
            />
          </div>

          <div style={{ width: "180px" }}>
            <Select
              options={MONTH_OPTIONS}
              value={getCurrentOption(MONTH_OPTIONS, filterMonth)}
              onChange={(opt) =>
                handleFilterChange(setFilterMonth, opt ? opt.value : "all")
              }
              styles={CUSTOM_SELECT_STYLES}
              isSearchable={false}
              placeholder="Месец"
            />
          </div>
        </div>
      </div>

      {loadingExpenses ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
          <span className="loading-spinner">↻</span> Зареждане на данни...
        </div>
      ) : (
        <>
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
                expenses.map((exp, idx) => {
                  const paidVal = `${exp.paid ?? ""}`.toLowerCase();
                  const isPaid =
                    paidVal === "да" ||
                    paidVal === "yes" ||
                    paidVal === "true" ||
                    exp.paid === true;

                  return (
                    <tr
                      key={exp.id}
                      onClick={() => navigate(`/admin/editexpense/${exp.id}`)}
                      style={{ cursor: "pointer" }}
                    >
                      <td style={{ color: "#999", fontSize: "0.85rem" }}>
                        {(currentPage - 1) * pageSize + idx + 1}
                      </td>

                      <td data-label="Вид">
                        <span className="expense-icon">
                          {getExpenseIcon(exp.type)}
                        </span>
                        {EXPENSE_TYPES[exp.type] || exp.type}
                      </td>

                      <td data-label="Адрес" style={{ fontWeight: 500 }}>
                        {exp.building?.name}, {exp.building?.address}
                      </td>

                      <td data-label="Период">
                        {MONTH_NAMES[exp.month]} {exp.year}
                      </td>

                      <td data-label="Платено">
                        <span
                          className={
                            isPaid
                              ? "status-badge-expenses status-paid-expenses"
                              : "status-badge-expenses status-unpaid-expenses"
                          }
                        >
                          {isPaid ? "Платено" : "Неплатено"}
                        </span>
                      </td>

                      <td
                        style={{
                          color: "#666",
                          fontSize: "0.9rem",
                          fontStyle: "italic",
                        }}
                      >
                        {exp.notes
                          ? exp.notes.length > 25
                            ? exp.notes.substring(0, 25) + "..."
                            : exp.notes
                          : "-"}
                      </td>

                      <td data-label="Сума" className="amount-cell">
                        {Number(exp.current_month).toFixed(2)} лв.
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {totalCount > pageSize && (
            <div className="pagination">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                ⬅ Предишна
              </button>
              <span>
                Страница {currentPage} от {totalPages || 1}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Следваща ➡
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AdminExpenses;
