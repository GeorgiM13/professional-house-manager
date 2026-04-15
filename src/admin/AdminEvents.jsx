import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import { supabase } from "../supabaseClient";
import { useUserBuildings } from "./hooks/UseUserBuildings";
import { useLocalUser } from "./hooks/UseLocalUser";
import { useTheme } from "../components/ThemeContext";
import { generateDOCX } from "./utils/eventNotices";
import "./styles/AdminEvents.css";

import {
  CalendarDays,
  Building,
  Megaphone,
  CircleDollarSign,
  Wrench,
  Sparkles,
  FileText,
  CheckCircle2,
  Circle,
  Loader2,
} from "lucide-react";

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
  { value: "all", label: "Всички години", iconType: "calendar" },
  ...Array.from({ length: 5 }, (_, i) => ({
    value: CURRENT_YEAR - i,
    label: `${CURRENT_YEAR - i} година`,
  })),
];

const MONTH_OPTIONS = [
  { value: "all", label: "Всички месеци", iconType: "calendar" },
  ...Object.entries(MONTH_NAMES).map(([key, name]) => ({
    value: key,
    label: name,
  })),
];

const customFormatOptionLabel = ({ label, iconType }, { context }) => {
  let Icon = null;
  if (iconType === "calendar") Icon = CalendarDays;
  if (iconType === "building") Icon = Building;

  const shouldShowIcon = Icon && context === "value";

  return (
    <div className="adev-select-item">
      {shouldShowIcon && (
        <Icon size={16} strokeWidth={2.5} className="adev-select-icon" />
      )}
      <span>{label}</span>
    </div>
  );
};

const CUSTOM_SELECT_STYLES = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: "var(--ae-bg-card)",
    borderColor: state.isFocused ? "var(--ae-accent)" : "var(--ae-border)",
    borderRadius: "8px",
    minHeight: "42px",
    color: "var(--ae-text-main)",
    boxShadow: state.isFocused ? "0 0 0 3px rgba(59, 130, 246, 0.1)" : "none",
  }),
  menu: (provided) => ({
    ...provided,
    zIndex: 9999,
    backgroundColor: "var(--ae-bg-card)",
    border: "1px solid var(--ae-border)",
  }),
  singleValue: (provided) => ({ ...provided, color: "var(--ae-text-main)" }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "var(--ae-accent)"
      : state.isFocused
        ? "var(--ae-hover)"
        : "transparent",
    color: state.isSelected ? "white" : "var(--ae-text-main)",
    cursor: "pointer",
  }),
};

const getEventIconData = (subject, status) => {
  const sub = subject?.toLowerCase() || "";

  if (sub.includes("събрание")) {
    return {
      icon: <Megaphone size={18} strokeWidth={2.5} />,
      colorClass: "icon-purple",
    };
  }
  if (
    sub.includes("каса") ||
    sub.includes("такси") ||
    sub.includes("плащане")
  ) {
    return {
      icon: <CircleDollarSign size={18} strokeWidth={2.5} />,
      colorClass: "icon-green",
    };
  }
  if (sub.includes("ремонт")) {
    return {
      icon: <Wrench size={18} strokeWidth={2.5} />,
      colorClass: "icon-orange",
    };
  }
  if (sub.includes("почистване")) {
    return {
      icon: <Sparkles size={18} strokeWidth={2.5} />,
      colorClass: "icon-cyan",
    };
  }

  return {
    icon: <CalendarDays size={18} strokeWidth={2.5} />,
    colorClass: "icon-blue",
  };
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
  const [filterToday, setFilterToday] = useState(false);
  const [stats, setStats] = useState({ total: 0, meetings: 0, fees: 0 });

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const buildingOptions = useMemo(
    () => [
      { value: "all", label: "Всички сгради", iconType: "building" },
      ...buildings.map((b) => ({
        value: b.id,
        label: `${b.name}, ${b.address}`,
      })),
    ],
    [buildings],
  );

  useEffect(() => {
    async function fetchAndProcessEvents() {
      if (!userId && !loadingBuildings) return;
      setLoadingEvents(true);
      try {
        let query = supabase
          .from("events")
          .select(
            `id, status, subject, completion_date, created_at, building_id, building:building_id(name, address), assigned_user:assigned_to(first_name, last_name)`,
          )
          .order("completion_date", { ascending: false });

        if (selectedBuilding !== "all")
          query = query.eq("building_id", selectedBuilding);
        else if (buildings.length > 0)
          query = query.in(
            "building_id",
            buildings.map((b) => b.id),
          );

        const { data, error } = await query;
        if (error) throw error;

        const allData = data || [];
        let tableData = [...allData];

        if (filterToday) {
          const todayStr = new Date().toDateString();

          tableData = tableData.filter((e) => {
            const d = new Date(e.completion_date || e.created_at);
            return d.toDateString() === todayStr;
          });
        } else {
          if (filterYear !== "all") {
            tableData = tableData.filter(
              (e) =>
                new Date(e.completion_date || e.created_at).getFullYear() ===
                Number(filterYear),
            );
          }
          if (filterMonth !== "all") {
            tableData = tableData.filter(
              (e) =>
                new Date(e.completion_date || e.created_at).getMonth() + 1 ===
                Number(filterMonth),
            );
          }
        }

        let statsData = [];
        const isFilterActive =
          filterToday || filterYear !== "all" || filterMonth !== "all";
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
    filterToday,
    buildings,
    userId,
    loadingBuildings,
  ]);

  const calculateStats = (data) => {
    const total = data.length;
    const meetings = data.filter((e) =>
      e.subject?.toLowerCase().includes("събрание"),
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
          {day}.{month}.{yearFull} г.
          <span className="dm-time-desktop">{time}</span>
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
    currentPage * pageSize,
  );
  const totalPages = Math.ceil(events.length / pageSize);
  const getSelectValue = (options, value) =>
    options.find((o) => String(o.value) === String(value)) || options[0];

  const toggleStatus = async (eventId, currentStatus) => {
    const statusLower = (currentStatus || "").toLowerCase();
    const targetStatus = statusLower === "изпълнено" ? "ново" : "изпълнено";

    setEvents((prev) =>
      prev.map((ev) =>
        ev.id === eventId ? { ...ev, status: targetStatus } : ev,
      ),
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
          ev.id === eventId ? { ...ev, status: currentStatus } : ev,
        ),
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
          <div className="adev-filter-building">
            <Select
              options={buildingOptions}
              value={getSelectValue(buildingOptions, selectedBuilding)}
              onChange={(opt) => setSelectedBuilding(opt ? opt.value : "all")}
              styles={CUSTOM_SELECT_STYLES}
              placeholder="Изберете сграда"
              isSearchable={true}
              formatOptionLabel={customFormatOptionLabel}
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
          <div className="adev-stat-icon icon-blue">
            <CalendarDays size={24} strokeWidth={2.5} />
          </div>
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
          <div className="adev-stat-icon icon-purple">
            <Megaphone size={24} strokeWidth={2.5} />
          </div>
          <div className="adev-stat-info">
            <span className="adev-stat-label">Събрания</span>
            <span className="adev-stat-value">
              <CountUp value={stats.meetings} /> <small>бр.</small>
            </span>
          </div>
        </div>
        <div className="adev-stat-card green">
          <div className="adev-stat-icon icon-green">
            <CircleDollarSign size={24} strokeWidth={2.5} />
          </div>
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
          <button
            className={`adev-today-toggle ${filterToday ? "active" : ""}`}
            onClick={() => setFilterToday(!filterToday)}
            title="Покажи събития само за днес"
          >
            {filterToday ? (
              <CheckCircle2 size={16} strokeWidth={2.5} />
            ) : (
              <CalendarDays size={16} strokeWidth={2.5} />
            )}
            Днес
          </button>
          <div className="adev-filter-date">
            <Select
              options={YEAR_OPTIONS}
              value={getSelectValue(YEAR_OPTIONS, filterYear)}
              onChange={(opt) => setFilterYear(opt.value)}
              styles={CUSTOM_SELECT_STYLES}
              isSearchable={false}
              placeholder="Година"
              formatOptionLabel={customFormatOptionLabel}
            />
          </div>
          <div className="adev-filter-date">
            <Select
              options={MONTH_OPTIONS}
              value={getSelectValue(MONTH_OPTIONS, filterMonth)}
              onChange={(opt) => setFilterMonth(opt.value)}
              styles={CUSTOM_SELECT_STYLES}
              isSearchable={false}
              placeholder="Месец"
              formatOptionLabel={customFormatOptionLabel}
            />
          </div>
        </div>
      </div>

      {loadingEvents ? (
        <div className="adev-loading">
          <Loader2 size={24} strokeWidth={2.5} className="adev-spinner-icon" />{" "}
          Зареждане...
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
                <th className="adev-th-actions">Действия</th>
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
                  const eventIconData = getEventIconData(
                    event.subject,
                    event.status,
                  );
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
                        <span
                          className={`adev-icon ${eventIconData.colorClass}`}
                        >
                          {eventIconData.icon}
                        </span>
                        <span>{event.subject}</span>
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
                          className={`mobile-status-badge ${statusClass} hidden-badge`}
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
                          <FileText size={18} strokeWidth={2.5} />
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
                          {s === "изпълнено" ? (
                            <CheckCircle2 size={18} strokeWidth={2.5} />
                          ) : (
                            <Circle size={18} strokeWidth={2.5} />
                          )}
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
