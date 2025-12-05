import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom"; // Добавих useLocation
import Select from "react-select";
import { supabase } from "../../supabaseClient";
import { useTheme } from "../../components/ThemeContext";
import { useUserBuildings } from "../hooks/UseUserBuildings";
import { useLocalUser } from "../hooks/UseLocalUser";
import "./styles/Users.css";

const CountUp = ({ value, duration = 800 }) => {
  const [displayValue, setDisplayValue] = useState(0);
  useEffect(() => {
    let start = 0;
    let startTime = null;
    let frame;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(start + (value - start) * easeProgress);
      if (progress < 1) frame = requestAnimationFrame(animate);
      else setDisplayValue(value);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);
  return <>{Math.round(displayValue)}</>;
};

function BuildingUsers() {
  const { isDarkMode } = useTheme();
  const { userId } = useLocalUser();
  const navigate = useNavigate();
  const location = useLocation(); // Трябва ни за state-a
  const { buildings } = useUserBuildings(userId);

  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [units, setUnits] = useState([]);
  const [filteredUnits, setFilteredUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [localSearch, setLocalSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  // Нов state за отложен скрол
  const [pendingScroll, setPendingScroll] = useState(null);

  const PAGE_SIZE = 50;

  const stats = useMemo(() => {
    const total = filteredUnits.length;
    const residents = filteredUnits.reduce(
      (acc, curr) => acc + (curr.residents || 0),
      0
    );
    const empty = filteredUnits.filter((u) => !u.user_id).length;
    return { total, residents, empty };
  }, [filteredUnits]);

  // 1. Fetch Logic
  useEffect(() => {
    if (!selectedBuilding) {
      setUnits([]);
      setFilteredUnits([]);
      return;
    }

    // ВАЖНО: Махнахме setCurrentPage(1) от тук!
    // То пречеше на възстановяването на страницата.

    const fetchUnits = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("property_units")
        .select("*")
        .eq("building_id", selectedBuilding.value)
        .order("floor", { ascending: true });

      if (!error && data) {
        const sortedData = data.sort((a, b) => {
          const floorA = parseInt(a.floor, 10) || 0;
          const floorB = parseInt(b.floor, 10) || 0;
          if (floorA !== floorB) return floorA - floorB;
          return String(a.number).localeCompare(String(b.number), undefined, {
            numeric: true,
            sensitivity: "base",
          });
        });

        setUnits(sortedData);
        setFilteredUnits(sortedData);
      }
      setLoading(false);
    };
    fetchUnits();
  }, [selectedBuilding]);

  // 2. Search Logic
  useEffect(() => {
    if (!localSearch) {
      setFilteredUnits(units);
    } else {
      setCurrentPage(1); // При търсене връщаме на 1-ва страница
      const lower = localSearch.toLowerCase();
      setFilteredUnits(
        units.filter(
          (u) =>
            u.first_name?.toLowerCase().includes(lower) ||
            u.last_name?.toLowerCase().includes(lower) ||
            u.number?.toString().includes(lower)
        )
      );
    }
  }, [localSearch, units]);

  // 3. Restore State Logic (Възстановяване)
  useEffect(() => {
    if (location.state?.previousBuilding) {
      // Възстановяваме сградата
      setSelectedBuilding(location.state.previousBuilding);

      // Възстановяваме търсенето
      if (location.state.previousSearch) {
        setLocalSearch(location.state.previousSearch);
      }

      // Възстановяваме страницата
      if (location.state.previousPage) {
        setCurrentPage(location.state.previousPage);
      }

      // Запазваме скрола за по-късно (когато зареди loading: false)
      if (location.state.scrollPosition) {
        setPendingScroll(location.state.scrollPosition);
      }
    }
  }, [location.state]);

  // 4. Scroll Execution Logic (Изпълнение на скрола)
  useEffect(() => {
    if (!loading && pendingScroll !== null && units.length > 0) {
      // Изчакваме малко DOM-а да се нарисува
      setTimeout(() => {
        window.scrollTo({ top: pendingScroll, behavior: "auto" });
        setPendingScroll(null); // Чистим, за да не скролва пак
      }, 100);
    }
  }, [loading, pendingScroll, units]);

  const totalPages = Math.ceil(filteredUnits.length / PAGE_SIZE);
  const currentData = filteredUnits.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Ръчна смяна на сграда
  const handleBuildingChange = (option) => {
    setSelectedBuilding(option);
    setCurrentPage(1); // Само тук нулираме страницата
    setLocalSearch(""); // Чистим търсенето при смяна на сграда
  };

  const buildingOptions = buildings.map((b) => ({
    value: b.id,
    label: `${b.name}, ${b.address}`,
  }));

  const selectStyles = useMemo(
    () => ({
      control: (base, state) => ({
        ...base,
        backgroundColor: isDarkMode ? "#1e293b" : "white",
        borderColor: state.isFocused
          ? "#3b82f6"
          : isDarkMode
          ? "#334155"
          : "#e2e8f0",
        color: isDarkMode ? "#f1f5f9" : "#4a5568",
        borderRadius: "8px",
        minHeight: "42px",
      }),
      menu: (base) => ({
        ...base,
        backgroundColor: isDarkMode ? "#1e293b" : "white",
        zIndex: 9999,
      }),
      option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected
          ? "#3b82f6"
          : state.isFocused
          ? isDarkMode
            ? "#334155"
            : "#eff6ff"
          : "transparent",
        color: state.isSelected ? "white" : isDarkMode ? "#f1f5f9" : "#4a5568",
        cursor: "pointer",
      }),
      singleValue: (base) => ({
        ...base,
        color: isDarkMode ? "#f1f5f9" : "#4a5568",
      }),
      input: (base) => ({ ...base, color: isDarkMode ? "#f1f5f9" : "#4a5568" }),
    }),
    [isDarkMode]
  );

  const getBadgeClass = (type) => {
    switch (type) {
      case "apartment":
        return "au-badge-apartment";
      case "office":
        return "au-badge-office";
      case "garage":
        return "au-badge-garage";
      case "retail":
        return "au-badge-retail";
      default:
        return "au-badge-garage";
    }
  };

  const getTypeIcon = (type) => {
    const icons = { apartment: "🏠", office: "💼", garage: "🚗", retail: "🏪" };
    return icons[type] || "📦";
  };

  return (
    <div className={`au-page ${isDarkMode ? "au-dark" : "au-light"}`}>
      <div className="au-header">
        <div className="au-header-left">
          <h1>Управление на Сгради</h1>
          <p>Списък на обекти, живущи и статистика по сгради</p>
        </div>
        <div className="au-header-right">
          <button
            className="au-btn-primary"
            onClick={() => navigate("/admin/add-user-to-building")}
          >
            + Добави към сграда
          </button>
        </div>
      </div>

      <div className="au-toolbar">
        <div style={{ width: "300px", maxWidth: "100%" }}>
          <Select
            options={buildingOptions}
            value={selectedBuilding}
            onChange={handleBuildingChange}
            placeholder="🏢 Изберете сграда..."
            styles={selectStyles}
          />
        </div>
        {selectedBuilding && (
          <input
            type="text"
            className="au-search-input"
            style={{ flex: 1 }}
            placeholder="🔍 Търси ап. № или име в тази сграда..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
          />
        )}
      </div>

      {selectedBuilding ? (
        <>
          <div className="au-stats-container">
            <div className="au-stat-card blue">
              <div className="au-stat-icon">🏢</div>
              <div className="au-stat-content">
                <span className="au-stat-label">Общо обекти</span>
                <span className="au-stat-value">
                  <CountUp value={stats.total} />
                </span>
              </div>
            </div>
            <div className="au-stat-card purple">
              <div className="au-stat-icon">👥</div>
              <div className="au-stat-content">
                <span className="au-stat-label">Живущи</span>
                <span className="au-stat-value">
                  <CountUp value={stats.residents} />
                </span>
              </div>
            </div>
            <div className="au-stat-card orange">
              <div className="au-stat-icon">🚫</div>
              <div className="au-stat-content">
                <span className="au-stat-label">Свободни / Без собственик</span>
                <span className="au-stat-value">
                  <CountUp value={stats.empty} />
                </span>
              </div>
            </div>
          </div>

          {loading ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px",
                color: "var(--au-text-sec)",
              }}
            >
              <span className="loading-spinner">↻</span> Зареждане на обекти...
            </div>
          ) : (
            <>
              <table className="au-table desktop-view">
                <thead>
                  <tr>
                    <th>Обект</th>
                    <th>Етаж</th>
                    <th>Номер</th>
                    <th>Собственик</th>
                    <th>Площ</th>
                    <th style={{ textAlign: "right" }}>Живущи</th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center" }}>
                        Няма намерени резултати.
                      </td>
                    </tr>
                  ) : (
                    currentData.map((u, i) => (
                      <tr
                        key={`${u.type}-${u.id}`}
                        onClick={() =>
                          navigate(`/admin/edit-user/${u.user_id}`, {
                            state: {
                              buildingId: u.building_id,
                              propertyId: u.id,
                              propertyType: u.type,
                              // Пращаме state за връщане
                              previousBuilding: selectedBuilding,
                              previousPage: currentPage,
                              previousSearch: localSearch,
                              scrollPosition: window.scrollY,
                            },
                          })
                        }
                      >
                        <td>
                          <span className={`au-badge ${getBadgeClass(u.type)}`}>
                            {getTypeIcon(u.type)}{" "}
                            {u.type === "apartment" ? "Апартамент" : u.type}
                          </span>
                        </td>
                        <td>{u.floor}</td>
                        <td style={{ fontWeight: 700 }}>{u.number}</td>
                        <td>
                          {u.first_name ? (
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                              }}
                            >
                              <span style={{ fontWeight: 500 }}>
                                {u.first_name} {u.last_name}
                              </span>
                              {u.phone && (
                                <span
                                  style={{
                                    fontSize: "0.8em",
                                    color: "var(--au-text-sec)",
                                  }}
                                >
                                  📞 {u.phone}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span
                              style={{
                                color: "var(--au-text-sec)",
                                fontStyle: "italic",
                              }}
                            >
                              - Свободен -
                            </span>
                          )}
                        </td>
                        <td>{u.area} m²</td>
                        <td style={{ textAlign: "right", fontWeight: 700 }}>
                          {u.residents}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              <div className="au-mobile-list mobile-view">
                {currentData.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "2rem",
                      color: "var(--au-text-sec)",
                    }}
                  >
                    Няма намерени резултати.
                  </div>
                ) : (
                  currentData.map((u, i) => (
                    <div
                      key={`${u.type}-${u.id}`}
                      className="au-mobile-card"
                      onClick={() =>
                        navigate(`/admin/edit-user/${u.user_id}`, {
                          state: {
                            buildingId: u.building_id,
                            propertyId: u.id,
                            propertyType: u.type,
                            previousBuilding: selectedBuilding,
                            previousPage: currentPage,
                            previousSearch: localSearch,
                            scrollPosition: window.scrollY,
                          },
                        })
                      }
                    >
                      <div className="au-card-header">
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <span style={{ fontSize: "1.2rem" }}>
                            {getTypeIcon(u.type)}
                          </span>
                          <span className="au-card-title">№ {u.number}</span>
                        </div>
                        <span
                          style={{
                            fontSize: "0.9rem",
                            color: "var(--au-text-sec)",
                          }}
                        >
                          Ет. {u.floor}
                        </span>
                      </div>
                      <div
                        className="au-card-subtitle"
                        style={{ marginTop: "5px" }}
                      >
                        {u.first_name ? (
                          <>
                            👤 {u.first_name} {u.last_name}
                          </>
                        ) : (
                          <span style={{ fontStyle: "italic" }}>
                            Няма собственик
                          </span>
                        )}
                      </div>
                      <div className="au-card-footer">
                        <span style={{ fontWeight: 600 }}>
                          {u.residents} живущи
                        </span>
                        <span>{u.area} m²</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {totalPages > 1 && (
                <div className="au-pagination">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    ⬅ Предишна
                  </button>
                  <span>
                    Страница {currentPage} от {totalPages}
                  </span>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    Следваща ➡
                  </button>
                </div>
              )}
            </>
          )}
        </>
      ) : (
        <div
          style={{
            textAlign: "center",
            padding: "4rem",
            color: "var(--au-text-sec)",
            fontStyle: "italic",
          }}
        >
          👆 Изберете сграда от менюто, за да видите списък с обекти и
          статистика.
        </div>
      )}
    </div>
  );
}

export default BuildingUsers;
