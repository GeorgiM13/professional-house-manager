import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import { supabase } from "../supabaseClient";
import { useUserBuildings } from "./hooks/UseUserBuildings";
import { useLocalUser } from "./hooks/UseLocalUser";
import { useTheme } from "../components/ThemeContext";
import { generateDOCX } from "./utils/eventNotices";
import "./styles/AdminEvents.css";

const CountUp = ({ value, duration = 800, decimals = 0 }) => {
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
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [
  { value: "all", label: "📅 Всички години" },
  ...Array.from({ length: 5 }, (_, i) => ({
    value: CURRENT_YEAR - i,
    label: `${CURRENT_YEAR - i} година`,
  })),
];
const MONTH_OPTIONS = [
  { value: "all", label: "📅 Всички месеци" },
  ...Object.entries(MONTH_NAMES).map(([key, name]) => ({
    value: key,
    label: name,
  })),
];

const CUSTOM_SELECT_STYLES = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: "var(--ae-bg-card)",
    borderColor: state.isFocused ? "var(--ae-accent)" : "var(--ae-border)",
    borderRadius: "8px",
    color: "var(--ae-text-main)",
    boxShadow: state.isFocused ? "0 0 0 2px var(--ae-accent-light)" : "none",
  }),
  menu: (provided) => ({
    ...provided,
    zIndex: 9999,
    backgroundColor: "var(--ae-bg-card)",
  }),
  singleValue: (provided) => ({ ...provided, color: "var(--ae-text-main)" }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "var(--ae-accent)"
      : state.isFocused
      ? "var(--ae-bg-page)"
      : "transparent",
    color: state.isSelected ? "white" : "var(--ae-text-main)",
    cursor: "pointer",
  }),
};

const getEventIcon = (subject, status) => {
  const sub = subject?.toLowerCase() || "";
  if (sub.includes("събрание")) return "📢";
  if (sub.includes("каса") || sub.includes("такси") || sub.includes("плащане"))
    return "💰";
  if (sub.includes("ремонт")) return "🛠️";
  if (sub.includes("почистване")) return "🧹";
  return "📅";
};

export default function AdminEvents() {
  const navigate = useNavigate();
  const { userId } = useLocalUser();
  const { isDarkMode } = useTheme();

  const { buildings, loading: loadingBuildings } = useUserBuildings(userId);
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const [selectedBuilding, setSelectedBuilding] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [filterMonth, setFilterMonth] = useState("all");
  const [stats, setStats] = useState({ total: 0, meetings: 0, fees: 0 });

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

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
    async function fetchAndProcessEvents() {
      if (!userId && !loadingBuildings) return;
      setLoadingEvents(true);
      try {
        let query = supabase
          .from("events")
          .select(
            `id, status, subject, completion_date, created_at, building_id, building:building_id(name, address), assigned_user:assigned_to(first_name, last_name)`
          )
          .order("completion_date", { ascending: false });

        if (selectedBuilding !== "all")
          query = query.eq("building_id", selectedBuilding);
        else if (buildings.length > 0)
          query = query.in(
            "building_id",
            buildings.map((b) => b.id)
          );

        const { data, error } = await query;
        if (error) throw error;

        const allData = data || [];
        let tableData = [...allData];

        if (filterYear !== "all") {
          tableData = tableData.filter(
            (e) =>
              new Date(e.completion_date || e.created_at).getFullYear() ===
              Number(filterYear)
          );
        }
        if (filterMonth !== "all") {
          tableData = tableData.filter(
            (e) =>
              new Date(e.completion_date || e.created_at).getMonth() + 1 ===
              Number(filterMonth)
          );
        }

        let statsData = [];
        const isFilterActive = filterYear !== "all" || filterMonth !== "all";
        if (isFilterActive) {
          statsData = tableData;
        } else {
          const now = new Date();
          statsData = allData.filter((e) => {
            const d = new Date(e.completion_date || e.created_at);
            return (
              d.getMonth() === now.getMonth() &&
              d.getFullYear() === now.getFullYear()
            );
          });
        }

        setEvents(tableData);
        calculateStats(statsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingEvents(false);
      }
    }
    fetchAndProcessEvents();
  }, [
    selectedBuilding,
    filterYear,
    filterMonth,
    buildings,
    userId,
    loadingBuildings,
  ]);

  const calculateStats = (data) => {
    const total = data.length;
    const meetings = data.filter((e) =>
      e.subject?.toLowerCase().includes("събрание")
    ).length;
    const fees = data.filter((e) => {
      const sub = e.subject?.toLowerCase() || "";
      return (
        sub.includes("каса") || sub.includes("такси") || sub.includes("плащане")
      );
    }).length;
    setStats({ total, meetings, fees });
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const d = new Date(dateString);

    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const yearFull = d.getFullYear();
    const yearShort = String(yearFull).slice(-2);
    const time = d.toLocaleTimeString("bg-BG", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <>
        <span className="date-desktop">
          {day}.{month}.{yearFull} г.{" "}
          <span style={{ color: "var(--ae-text-sec)", marginLeft: "4px" }}>
            {time}
          </span>
        </span>

        <div className="date-mobile">
          <div className="dm-date">
            {day}.{month}.{yearShort}
          </div>
          <div className="dm-time">{time}</div>
        </div>
      </>
    );
  };

  const paginatedEvents = events.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  const totalPages = Math.ceil(events.length / pageSize);
  const getSelectValue = (options, value) =>
    options.find((o) => String(o.value) === String(value)) || options[0];

  const toggleStatus = async (eventId, currentStatus) => {
    const statusLower = (currentStatus || "").toLowerCase();
    const targetStatus = statusLower === "изпълнено" ? "ново" : "изпълнено";

    setEvents((prev) =>
      prev.map((ev) =>
        ev.id === eventId ? { ...ev, status: targetStatus } : ev
      )
    );

    try {
      const { error } = await supabase
        .from("events")
        .update({ status: targetStatus })
        .eq("id", eventId);

      if (error) throw error;
    } catch (error) {
      console.error("Грешка:", error);
      alert(`Грешка: ${error.message}`);

      setEvents((prev) =>
        prev.map((ev) =>
          ev.id === eventId ? { ...ev, status: currentStatus } : ev
        )
      );
    }
  };

  const handleGenerateDocx = (eventData) => {
    if (eventData) {
      generateDOCX(eventData);
    }
  };

  return (
    <div className={`adev-page ${isDarkMode ? "adev-dark" : "adev-light"}`}>
      <div className="adev-header">
        <div className="adev-header-left">
          <h1>Събития</h1>
          <p className="adev-subtitle">Управление на задачи и събрания</p>
        </div>
        <div className="adev-header-right">
          <div style={{ width: "250px" }}>
            <Select
              options={buildingOptions}
              value={getSelectValue(buildingOptions, selectedBuilding)}
              onChange={(opt) => setSelectedBuilding(opt ? opt.value : "all")}
              styles={CUSTOM_SELECT_STYLES}
              placeholder="Изберете сграда"
              isSearchable={true}
            />
          </div>
          <button
            className="adev-add-btn"
            onClick={() => navigate("/admin/addevent")}
          >
            + Нова задача
          </button>
        </div>
      </div>

      <div className="adev-stats-grid">
        <div className="adev-stat-card blue">
          <div className="adev-stat-icon">📅</div>
          <div className="adev-stat-info">
            <span className="adev-stat-label">
              {filterYear === "all" && filterMonth === "all"
                ? "Събития (Този месец)"
                : "Събития (Избрани)"}
            </span>
            <span className="adev-stat-value">
              <CountUp value={stats.total} /> <small>бр.</small>
            </span>
          </div>
        </div>
        <div className="adev-stat-card purple">
          <div className="adev-stat-icon">📢</div>
          <div className="adev-stat-info">
            <span className="adev-stat-label">Събрания</span>
            <span className="adev-stat-value">
              <CountUp value={stats.meetings} /> <small>бр.</small>
            </span>
          </div>
        </div>
        <div className="adev-stat-card green">
          <div className="adev-stat-icon">💰</div>
          <div className="adev-stat-info">
            <span className="adev-stat-label">Събиране на такси</span>
            <span className="adev-stat-value">
              <CountUp value={stats.fees} /> <small>бр.</small>
            </span>
          </div>
        </div>
      </div>

      <div className="adev-toolbar">
        <h3>Списък събития</h3>
        <div className="adev-filters-right">
          <div style={{ width: "160px" }}>
            <Select
              options={YEAR_OPTIONS}
              value={getSelectValue(YEAR_OPTIONS, filterYear)}
              onChange={(opt) => setFilterYear(opt.value)}
              styles={CUSTOM_SELECT_STYLES}
              isSearchable={false}
              placeholder="Година"
            />
          </div>
          <div style={{ width: "160px" }}>
            <Select
              options={MONTH_OPTIONS}
              value={getSelectValue(MONTH_OPTIONS, filterMonth)}
              onChange={(opt) => setFilterMonth(opt.value)}
              styles={CUSTOM_SELECT_STYLES}
              isSearchable={false}
              placeholder="Месец"
            />
          </div>
        </div>
      </div>

      {loadingEvents ? (
        <div className="adev-loading">
          <span className="adev-spinner">↻</span> Зареждане...
        </div>
      ) : (
        <>
          <table className="adev-table">
            <thead>
              <tr>
                <th>№</th>
                <th>Тема</th>
                <th>Сграда</th>
                <th>Дата на изпълнение</th>
                <th>Статус</th>
                <th>Възложено на</th>
                <th style={{ textAlign: "right" }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEvents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="adev-no-data">
                    Няма намерени събития.
                  </td>
                </tr>
              ) : (
                paginatedEvents.map((event, idx) => {
                  const s = (event.status || "").toLowerCase();
                  let statusClass = "st-default";
                  if (s.includes("ново") || s.includes("new"))
                    statusClass = "st-new";
                  else if (s.includes("изпълнено") || s.includes("done"))
                    statusClass = "st-done";

                  return (
                    <tr
                      key={event.id}
                      onClick={() => navigate(`/admin/event/${event.id}`)}
                      className="adev-row"
                    >
                      <td className="adev-idx">
                        {(currentPage - 1) * pageSize + idx + 1}
                      </td>

                      <td data-label="Тема" className="adev-subject">
                        <span className="adev-icon">
                          {getEventIcon(event.subject, event.status)}
                        </span>
                        {event.subject}
                      </td>

                      <td data-label="Сграда">{event.building?.name}</td>

                      <td data-label="Дата">
                        {formatDate(event.completion_date)}
                      </td>

                      <td data-label="Статус">
                        <span className={`adev-badge ${statusClass}`}>
                          {event.status || "Очаква"}
                        </span>
                      </td>

                      <td data-label="Възложено">
                        {event.assigned_user
                          ? `${event.assigned_user.first_name} ${event.assigned_user.last_name}`
                          : "-"}
                      </td>

                      <td
                        data-label="Действия"
                        className="adev-actions"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span
                          className={`mobile-status-badge ${statusClass}`}
                          style={{ display: "none" }}
                        >
                          {event.status}
                        </span>

                        <button
                          className="action-btn docx"
                          title="Генерирай DOCX"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGenerateDocx(event);
                          }}
                        >
                          📄
                        </button>

                        <button
                          className={`action-btn status ${
                            s === "изпълнено" ? "done" : ""
                          }`}
                          title="Промени статус"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStatus(event.id, event.status);
                          }}
                        >
                          {s === "изпълнено" ? "✅" : "⬜"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="adev-pagination">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                ⬅ Предишна
              </button>
              <span>
                Страница {currentPage} от {totalPages}
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
