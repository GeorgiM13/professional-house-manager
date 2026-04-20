import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Select from "react-select";
import { supabase } from "../../supabaseClient";
import { useTheme } from "../../components/ThemeContext";
import { useUserBuildings } from "../hooks/UseUserBuildings";
import { useLocalUser } from "../hooks/UseLocalUser";
import {
  Plus,
  Search,
  Building2,
  Users,
  DoorOpen,
  Loader2,
  Home,
  Briefcase,
  CarFront,
  Store,
  Package,
  Phone,
  User,
  ChevronLeft,
  ChevronRight,
  Pointer,
} from "lucide-react";
import "./styles/BuildingUsers.css";

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
  const location = useLocation();
  const { buildings } = useUserBuildings(userId);

  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [units, setUnits] = useState([]);
  const [filteredUnits, setFilteredUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [localSearch, setLocalSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [pendingScroll, setPendingScroll] = useState(null);

  const PAGE_SIZE = 50;

  const stats = useMemo(() => {
    const total = filteredUnits.length;
    const residents = filteredUnits.reduce(
      (acc, curr) => acc + (curr.residents || 0),
      0,
    );
    const empty = filteredUnits.filter((u) => !u.user_id).length;
    return { total, residents, empty };
  }, [filteredUnits]);

  useEffect(() => {
    if (!selectedBuilding) {
      setUnits([]);
      setFilteredUnits([]);
      return;
    }

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

  useEffect(() => {
    if (!localSearch) {
      setFilteredUnits(units);
    } else {
      setCurrentPage(1);
      const lower = localSearch.toLowerCase();
      setFilteredUnits(
        units.filter(
          (u) =>
            u.first_name?.toLowerCase().includes(lower) ||
            u.last_name?.toLowerCase().includes(lower) ||
            u.number?.toString().includes(lower),
        ),
      );
    }
  }, [localSearch, units]);

  useEffect(() => {
    if (location.state?.previousBuilding) {
      setSelectedBuilding(location.state.previousBuilding);

      if (location.state.previousSearch) {
        setLocalSearch(location.state.previousSearch);
      }

      if (location.state.previousPage) {
        setCurrentPage(location.state.previousPage);
      }

      if (location.state.scrollPosition) {
        setPendingScroll(location.state.scrollPosition);
      }
    }
  }, [location.state]);

  useEffect(() => {
    if (!loading && pendingScroll !== null && units.length > 0) {
      setTimeout(() => {
        window.scrollTo({ top: pendingScroll, behavior: "auto" });
        setPendingScroll(null);
      }, 100);
    }
  }, [loading, pendingScroll, units]);

  const totalPages = Math.ceil(filteredUnits.length / PAGE_SIZE);
  const currentData = filteredUnits.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBuildingChange = (option) => {
    setSelectedBuilding(option);
    setCurrentPage(1);
    setLocalSearch("");
  };

  const buildingOptions = buildings.map((b) => ({
    value: b.id,
    label: `${b.name}, ${b.address}`,
  }));

  const getBadgeClass = (type) => {
    switch (type) {
      case "apartment":
        return "bu-badge-apartment";
      case "office":
        return "bu-badge-office";
      case "garage":
        return "bu-badge-garage";
      case "retail":
        return "bu-badge-retail";
      default:
        return "bu-badge-garage";
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "apartment":
        return <Home size={14} strokeWidth={2.5} />;
      case "office":
        return <Briefcase size={14} strokeWidth={2.5} />;
      case "garage":
        return <CarFront size={14} strokeWidth={2.5} />;
      case "retail":
        return <Store size={14} strokeWidth={2.5} />;
      default:
        return <Package size={14} strokeWidth={2.5} />;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case "apartment":
        return "Апартамент";
      case "office":
        return "Офис";
      case "garage":
        return "Гараж";
      case "retail":
        return "Търговски обект";
      default:
        return type;
    }
  };

  return (
    <div className={`bu-page ${isDarkMode ? "au-dark" : "au-light"}`}>
      <div className="bu-header">
        <div className="bu-header-left">
          <h1>Управление на Сгради</h1>
          <p>Списък на обекти, живущи и статистика по сгради</p>
        </div>
        <div className="bu-header-right">
          <button
            className="bu-btn-primary"
            onClick={() => navigate("/admin/add-user-to-building")}
          >
            <Plus size={18} strokeWidth={2.5} /> Добави към сграда
          </button>
        </div>
      </div>

      <div className="bu-toolbar">
        <div className="bu-select-wrapper">
          <Select
            className="bu-react-select-container"
            classNamePrefix="bu-react-select"
            options={buildingOptions}
            value={selectedBuilding}
            onChange={handleBuildingChange}
            placeholder="Изберете сграда..."
          />
        </div>

        {selectedBuilding && (
          <div className="bu-search-wrapper">
            <Search size={18} strokeWidth={2.5} className="bu-search-icon" />
            <input
              type="text"
              className="bu-search-input"
              placeholder="Търси ап. № или име в тази сграда..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
            />
          </div>
        )}
      </div>

      {selectedBuilding ? (
        <>
          <div className="bu-stats-container">
            <div className="bu-stat-card blue">
              <div className="bu-stat-icon">
                <Building2 size={24} strokeWidth={2.5} />
              </div>
              <div className="bu-stat-content">
                <span className="bu-stat-label">Общо обекти</span>
                <span className="bu-stat-value">
                  <CountUp value={stats.total} />
                </span>
              </div>
            </div>
            <div className="bu-stat-card purple">
              <div className="bu-stat-icon">
                <Users size={24} strokeWidth={2.5} />
              </div>
              <div className="bu-stat-content">
                <span className="bu-stat-label">Живущи</span>
                <span className="bu-stat-value">
                  <CountUp value={stats.residents} />
                </span>
              </div>
            </div>
            <div className="bu-stat-card orange">
              <div className="bu-stat-icon">
                <DoorOpen size={24} strokeWidth={2.5} />
              </div>
              <div className="bu-stat-content">
                <span className="bu-stat-label">Свободни / Без собственик</span>
                <span className="bu-stat-value">
                  <CountUp value={stats.empty} />
                </span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="bu-loading-state">
              <Loader2
                size={24}
                strokeWidth={2.5}
                className="bu-loading-spinner"
              />{" "}
              Зареждане на обекти...
            </div>
          ) : (
            <>
              <table className="bu-table desktop-view">
                <thead>
                  <tr>
                    <th>Обект</th>
                    <th>Етаж</th>
                    <th>Номер</th>
                    <th>Собственик</th>
                    <th>Площ</th>
                    <th className="bu-text-right">Живущи</th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="bu-table-empty">
                        Няма намерени резултати.
                      </td>
                    </tr>
                  ) : (
                    currentData.map((u) => (
                      <tr
                        key={`${u.type}-${u.id}`}
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
                        <td>
                          <span className={`bu-badge ${getBadgeClass(u.type)}`}>
                            {getTypeIcon(u.type)}
                            {getTypeLabel(u.type)}
                          </span>
                        </td>
                        <td>{u.floor}</td>
                        <td className="bu-font-bold">{u.number}</td>
                        <td>
                          {u.first_name ? (
                            <div className="bu-owner-cell">
                              <span className="bu-owner-name">
                                {u.first_name} {u.last_name}
                              </span>
                              {u.phone && (
                                <span className="bu-owner-phone">
                                  <Phone size={14} strokeWidth={2.5} />
                                  {u.phone}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="bu-empty-state-text">
                              - Свободен -
                            </span>
                          )}
                        </td>
                        <td>{u.area} m²</td>
                        <td className="bu-text-right bu-font-bold">
                          {u.residents}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              <div className="bu-mobile-list mobile-view">
                {currentData.length === 0 ? (
                  <div className="bu-table-empty">Няма намерени резултати.</div>
                ) : (
                  currentData.map((u) => (
                    <div
                      key={`${u.type}-${u.id}`}
                      className="bu-mobile-card"
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
                      <div className="bu-card-header">
                        <div className="bu-card-header-left">
                          <span className="bu-card-icon-large">
                            {getTypeIcon(u.type)}
                          </span>
                          <span className="bu-card-title">№ {u.number}</span>
                        </div>
                        <span className="bu-card-floor">Ет. {u.floor}</span>
                      </div>

                      <div className="bu-card-subtitle">
                        {u.first_name ? (
                          <>
                            <User size={16} strokeWidth={2.5} />
                            <span>
                              {u.first_name} {u.last_name}
                            </span>
                          </>
                        ) : (
                          <span className="bu-empty-state-text">
                            Няма собственик
                          </span>
                        )}
                      </div>

                      <div className="bu-card-footer">
                        <span className="bu-font-bold">
                          {u.residents} живущи
                        </span>
                        <span>{u.area} m²</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {totalPages > 1 && (
                <div className="bu-pagination">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    <ChevronLeft size={16} strokeWidth={2.5} /> Предишна
                  </button>
                  <span>
                    Страница {currentPage} от {totalPages}
                  </span>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    Следваща <ChevronRight size={16} strokeWidth={2.5} />
                  </button>
                </div>
              )}
            </>
          )}
        </>
      ) : (
        <div className="bu-no-building-selected">
          <Pointer
            size={32}
            strokeWidth={2.5}
            className="bu-no-building-icon"
          />
          <p>
            Изберете сграда от менюто, за да видите списък с обекти и
            статистика.
          </p>
        </div>
      )}
    </div>
  );
}

export default BuildingUsers;
