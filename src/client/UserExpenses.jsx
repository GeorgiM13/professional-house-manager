import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import { supabase } from "../supabaseClient";
import { useUserBuildings } from "./hooks/useUserBuildings";
import { useLocalUser } from "./hooks/useLocalUser";
import { useTheme } from "../components/ThemeContext";
import ExpenseForecast from "../admin/ai/components/ExpenseForecast";
import "./styles/UserExpenses.css";

const CountUp = ({ value, duration = 800, decimals = 2 }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const startValue = useRef(0);
  const startTime = useRef(null);

  useEffect(() => {
    startValue.current = displayValue;
    startTime.current = null;
    let animationFrame;

    const animate = (timestamp) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      const current =
        startValue.current + (value - startValue.current) * easeProgress;

      setDisplayValue(current);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
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
  cleaning_supplies: "Консумативи",
  fee_annual_review: "Годишен преглед асансьор",
  internet_video: "Интернет/Видео",
  access_control: "Контрол на достъп",
  pest_control: "Дезинсекция",
  other: "Други",
};

const CUSTOM_SELECT_STYLES = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: "var(--uex-bg-card)",
    borderColor: state.isFocused ? "var(--uex-accent)" : "var(--uex-border)",
    borderRadius: "8px",
    color: "var(--uex-text-main)",
    boxShadow: state.isFocused ? "0 0 0 2px var(--uex-accent-light)" : "none",
    minHeight: "42px",
  }),
  menu: (provided) => ({
    ...provided,
    zIndex: 9999,
    backgroundColor: "var(--uex-bg-card)",
    border: "1px solid var(--uex-border)",
  }),
  singleValue: (provided) => ({ ...provided, color: "var(--uex-text-main)" }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "var(--uex-accent)"
      : state.isFocused
      ? "var(--uex-bg-page)"
      : "transparent",
    color: state.isSelected ? "white" : "var(--uex-text-main)",
    cursor: "pointer",
  }),
  placeholder: (provided) => ({ ...provided, color: "var(--uex-text-sec)" }),
};

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

const CURRENT_YEAR = new Date().getFullYear();

function UserExpenses() {
  const navigate = useNavigate();
  const { userId } = useLocalUser();
  const { isDarkMode } = useTheme();
  const { buildings, loading: buildingsLoading } = useUserBuildings(userId);

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

  const tableAbortController = useRef(null);
  const statsAbortController = useRef(null);

  const yearOptions = useMemo(() => {
    const years = Array.from(
      { length: CURRENT_YEAR - 2015 + 2 },
      (_, i) => CURRENT_YEAR + 1 - i
    );
    return [
      { value: "all", label: "📅 Всички години" },
      ...years.map((y) => ({ value: y, label: `${y} година` })),
    ];
  }, []);

  const monthOptions = useMemo(() => {
    return [
      { value: "all", label: "📅 Всички месеци" },
      ...Object.entries(MONTH_NAMES).map(([key, name]) => ({
        value: key,
        label: name,
      })),
    ];
  }, []);

  const buildingOptions = useMemo(
    () => [
      { value: "all", label: "🏢 Всички сгради" },
      ...buildings.map((b) => ({
        value: b.id,
        label: `${b.name}, ${b.address}`,
      })),
    ],
    [buildings]
  );

  useEffect(() => {
    if (buildings.length === 1) {
      setSelectedBuilding(buildings[0].id);
    }
  }, [buildings]);

  const buildBaseQuery = useCallback(
    (selectString, { count } = {}) => {
      let query = supabase.from("expenses").select(selectString, { count });

      if (selectedBuilding !== "all") {
        query = query.eq("building_id", selectedBuilding);
      } else if (buildings.length > 0) {
        query = query.in(
          "building_id",
          buildings.map((b) => b.id)
        );
      } else {
        return null;
      }

      if (filterYear !== "all") query = query.eq("year", filterYear);
      if (filterMonth !== "all") query = query.eq("month", filterMonth);

      return query;
    },
    [selectedBuilding, filterYear, filterMonth, buildings]
  );

  useEffect(() => {
    if (!userId || buildingsLoading) return;
    if (tableAbortController.current) tableAbortController.current.abort();
    tableAbortController.current = new AbortController();

    async function fetchTableData() {
      setLoadingExpenses(true);
      try {
        let query = buildBaseQuery(
          `id, type, month, year, current_month, paid, notes, building:building_id(name,address)`,
          { count: "exact" }
        );

        if (!query) {
          setExpenses([]);
          setLoadingExpenses(false);
          return;
        }

        query = query
          .order("year", { ascending: false })
          .order("month", { ascending: false })
          .range((currentPage - 1) * pageSize, currentPage * pageSize - 1)
          .abortSignal(tableAbortController.current.signal);

        const { data, error, count } = await query;
        if (!error) {
          setExpenses(data || []);
          setTotalCount(count || 0);
        }
      } catch (err) {
        if (err.name !== "AbortError") console.error(err);
      } finally {
        if (
          tableAbortController.current &&
          !tableAbortController.current.signal.aborted
        ) {
          setLoadingExpenses(false);
        }
      }
    }
    fetchTableData();
  }, [
    selectedBuilding,
    filterYear,
    filterMonth,
    currentPage,
    userId,
    buildingsLoading,
    buildBaseQuery,
  ]);

  useEffect(() => {
    if (!userId || buildingsLoading) return;
    if (statsAbortController.current) statsAbortController.current.abort();
    statsAbortController.current = new AbortController();

    async function fetchStatsData() {
      setLoadingStats(true);
      try {
        let query = buildBaseQuery("current_month, type", { count: "exact" });
        if (!query) return;

        query = query.abortSignal(statsAbortController.current.signal);
        const { data, error, count } = await query;

        if (!error) {
          const allData = data || [];
          if (allData.length === 0) {
            setBuildingStats({ total: 0, count: 0, maxExpense: null });
          } else {
            const total = allData.reduce(
              (sum, item) => sum + Number(item.current_month || 0),
              0
            );
            const max = allData.reduce((prev, current) =>
              Number(prev.current_month) > Number(current.current_month)
                ? prev
                : current
            );
            setBuildingStats({
              total,
              count: count || allData.length,
              maxExpense: max,
            });
          }
        }
      } catch (err) {
        if (err.name !== "AbortError") console.error(err);
      } finally {
        if (
          statsAbortController.current &&
          !statsAbortController.current.signal.aborted
        ) {
          setLoadingStats(false);
        }
      }
    }
    fetchStatsData();
  }, [
    selectedBuilding,
    filterYear,
    filterMonth,
    userId,
    buildingsLoading,
    buildBaseQuery,
  ]);

  const handleFilterChange = useCallback((setter, val) => {
    setter(val);
    setCurrentPage(1);
  }, []);

  const getCurrentOption = (options, value) =>
    options.find((opt) => String(opt.value) === String(value)) || options[0];
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className={`uex-page ${isDarkMode ? "uex-dark" : "uex-light"}`}>
      <div className="uex-header">
        <div className="uex-header-left">
          <h1>Разходи</h1>
          <p className="uex-subtitle">Преглед на сметки и плащания</p>
        </div>

        <div className="uex-header-right">
          {buildings.length > 1 ? (
            <div style={{ width: "250px" }}>
              <Select
                options={buildingOptions}
                value={getCurrentOption(buildingOptions, selectedBuilding)}
                onChange={(opt) =>
                  handleFilterChange(
                    setSelectedBuilding,
                    opt ? opt.value : "all"
                  )
                }
                styles={CUSTOM_SELECT_STYLES}
                placeholder="Изберете сграда"
                isSearchable={false}
              />
            </div>
          ) : (
            buildings.length === 1 && (
              <div className="uex-single-building">🏢 {buildings[0].name}</div>
            )
          )}
        </div>
      </div>
      <ExpenseForecast buildingId={selectedBuilding} />
      <div className="uex-stats-grid">
        <div
          className={`uex-stat-card total ${loadingStats ? "updating" : ""}`}
        >
          <div className="uex-stat-icon">📊</div>
          <div className="uex-stat-info">
            <span className="uex-stat-label">Общо разходи</span>
            <span className="uex-stat-value">
              <CountUp value={buildingStats.total} decimals={2} />{" "}
              <small>лв.</small>
            </span>
          </div>
        </div>

        <div
          className={`uex-stat-card count ${loadingStats ? "updating" : ""}`}
        >
          <div className="uex-stat-icon">🧾</div>
          <div className="uex-stat-info">
            <span className="uex-stat-label">Брой сметки</span>
            <span className="uex-stat-value">
              <CountUp value={buildingStats.count} decimals={0} />{" "}
              <small>бр.</small>
            </span>
          </div>
        </div>

        <div className={`uex-stat-card max ${loadingStats ? "updating" : ""}`}>
          <div className="uex-stat-icon">🔥</div>
          <div className="uex-stat-info">
            <span className="uex-stat-label">Най-голям разход</span>
            <span className="uex-stat-value">
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
            <span className="uex-stat-subtext">
              {buildingStats.maxExpense
                ? EXPENSE_TYPES[buildingStats.maxExpense.type] ||
                  buildingStats.maxExpense.type
                : "-"}
            </span>
          </div>
        </div>
      </div>
      <div className="uex-toolbar">
        <h3>История на плащанията</h3>
        <div className="uex-filters-right">
          <div style={{ width: "160px" }}>
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
          <div style={{ width: "160px" }}>
            <Select
              options={monthOptions}
              value={getCurrentOption(monthOptions, filterMonth)}
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
        <div className="uex-loading">
          <span className="uex-spinner">↻</span> Зареждане...
        </div>
      ) : (
        <>
          <table className="uex-table desktop-view">
            <thead>
              <tr>
                <th>№</th>
                <th>Вид Разход</th>
                <th>Сграда</th>
                <th>Период</th>
                <th>Статус</th>
                <th>Бележка</th>
                <th>Сума</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan="7" className="uex-no-data">
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
                      onClick={() => navigate(`/client/expense/${exp.id}`)}
                      className="uex-row"
                    >
                      <td className="uex-idx">
                        {(currentPage - 1) * pageSize + idx + 1}
                      </td>

                      <td data-label="Вид" className="uex-type-cell">
                        <span className="uex-icon">
                          {getExpenseIcon(exp.type)}
                        </span>
                        {EXPENSE_TYPES[exp.type] || exp.type}
                      </td>

                      <td data-label="Сграда">{exp.building?.name}</td>

                      <td data-label="Период">
                        {MONTH_NAMES[exp.month]} {exp.year}
                      </td>

                      <td data-label="Статус">
                        <span
                          className={
                            isPaid
                              ? "uex-badge uex-paid"
                              : "uex-badge uex-unpaid"
                          }
                        >
                          {isPaid ? "Платено" : "Неплатено"}
                        </span>
                      </td>

                      <td
                        data-label="Бележка"
                        style={{
                          color: "var(--uex-text-sec)",
                          fontStyle: "italic",
                          fontSize: "0.85rem",
                        }}
                      >
                        {exp.notes
                          ? exp.notes.length > 25
                            ? exp.notes.substring(0, 25) + "..."
                            : exp.notes
                          : "-"}
                      </td>

                      <td data-label="Сума" className="uex-amount">
                        {Number(exp.current_month).toFixed(2)} лв.
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          <div className="uex-mobile-list mobile-view">
            {expenses.length === 0 ? (
              <div className="uex-no-data">Няма намерени записи.</div>
            ) : (
              expenses.map((exp) => {
                const paidVal = `${exp.paid ?? ""}`.toLowerCase();
                const isPaid =
                  paidVal === "да" ||
                  paidVal === "yes" ||
                  paidVal === "true" ||
                  exp.paid === true;

                return (
                  <div
                    key={exp.id}
                    className="uex-mobile-card"
                    onClick={() => navigate(`/client/expense/${exp.id}`)}
                  >
                    <div className="uex-card-header">
                      <div className="uex-card-type">
                        <span className="uex-icon-large">
                          {getExpenseIcon(exp.type)}
                        </span>
                        <span>{EXPENSE_TYPES[exp.type] || exp.type}</span>
                      </div>
                      <span
                        className={`uex-badge small ${
                          isPaid ? "uex-paid" : "uex-unpaid"
                        }`}
                      >
                        {isPaid ? "Платено" : "Неплатено"}
                      </span>
                    </div>

                    <div className="uex-card-address">
                      📍 {exp.building?.name}
                    </div>

                    <div className="uex-card-footer">
                      <span className="uex-card-date">
                        {MONTH_NAMES[exp.month]} {exp.year}
                      </span>
                      <span className="uex-card-amount">
                        {Number(exp.current_month).toFixed(2)} лв.
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {totalCount > pageSize && (
            <div className="uex-pagination">
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

export default UserExpenses;
