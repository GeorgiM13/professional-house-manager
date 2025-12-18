import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import { supabase } from "../supabaseClient";
import { useUserBuildings } from "./hooks/UseUserBuildings";
import { useLocalUser } from "./hooks/UseLocalUser";
import { useTheme } from "../components/ThemeContext";
import "./styles/AdminReports.css";

const getStatusClass = (status) => {
  if (!status) return "st-default";
  const s = status.toLowerCase();
  if (s.includes("ново") || s.includes("new")) return "rst-new";
  if (s.includes("изпълнено") || s.includes("done")) return "rst-done";
  if (s.includes("работ") || s.includes("progress")) return "rst-working";
  if (s.includes("отхвърлено") || s.includes("reject")) return "rst-rejected";
  return "rst-default";
};

function AdminReports() {
  const navigate = useNavigate();
  const { userId } = useLocalUser();
  const { isDarkMode } = useTheme();

  const { buildings, loading: loadingBuildings } = useUserBuildings(userId);

  const [selectedBuilding, setSelectedBuilding] = useState("all");
  const [reports, setReports] = useState([]);
  const [showPastReports, setShowPastReports] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingReports, setLoadingReports] = useState(false);

  const pageSize = 20;

  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: isDarkMode ? "#1e293b" : "#ffffff",
      borderColor: state.isFocused
        ? "#3b82f6"
        : isDarkMode
        ? "#334155"
        : "#e2e8f0",
      color: isDarkMode ? "#f1f5f9" : "#1e293b",
      borderRadius: "8px",
      minHeight: "42px",
      boxShadow: state.isFocused ? "0 0 0 3px rgba(59, 130, 246, 0.1)" : "none",
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: isDarkMode ? "#1e293b" : "#ffffff",
      zIndex: 9999,
      border: isDarkMode ? "1px solid #334155" : "1px solid #e2e8f0",
    }),
    singleValue: (base) => ({
      ...base,
      color: isDarkMode ? "#f1f5f9" : "#1e293b",
    }),
    input: (base) => ({ ...base, color: isDarkMode ? "#f1f5f9" : "#1e293b" }),
    option: (base, state) => {
      if (state.isSelected)
        return {
          ...base,
          backgroundColor: "#3b82f6",
          color: "white",
          cursor: "pointer",
        };
      if (state.isFocused)
        return {
          ...base,
          backgroundColor: isDarkMode ? "#334155" : "#eff6ff",
          color: isDarkMode ? "#f1f5f9" : "#1e293b",
          cursor: "pointer",
        };
      return {
        ...base,
        backgroundColor: "transparent",
        color: isDarkMode ? "#f1f5f9" : "#1e293b",
        cursor: "pointer",
      };
    },
    placeholder: (base) => ({
      ...base,
      color: isDarkMode ? "#94a3b8" : "#a0aec0",
    }),
  };

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
    async function fetchReports() {
      if (loadingBuildings) return;

      setLoadingReports(true);
      try {
        const from = (currentPage - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = supabase
          .from("reports")
          .select(
            `
            id, status, subject, updated_at, created_at,
            building:building_id(name,address),
            submitted_by(first_name,second_name,last_name)
            `,
            { count: "exact" }
          )
          .order("created_at", { ascending: false })
          .range(from, to);

        if (!showPastReports) {
          query = query.in("status", ["ново", "работи се"]);
        }

        if (selectedBuilding !== "all") {
          query = query.eq("building_id", selectedBuilding);
        } else if (buildings.length > 0) {
          query = query.in(
            "building_id",
            buildings.map((b) => b.id)
          );
        }

        const { data, error, count } = await query;

        if (error) {
          console.error("Supabase error:", error);
        } else {
          setReports(data || []);
          setTotalCount(count || 0);
        }
      } catch (err) {
        console.error("System error:", err);
      } finally {
        setLoadingReports(false);
      }
    }

    fetchReports();
  }, [
    selectedBuilding,
    currentPage,
    pageSize,
    showPastReports,
    buildings,
    loadingBuildings,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [showPastReports, selectedBuilding]);

  const totalPages = Math.ceil(totalCount / pageSize);

  function formatDateTime(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString("bg-BG", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className={`arep-page ${isDarkMode ? "arep-dark" : "arep-light"}`}>
      <div className="arep-header">
        <div className="arep-header-left">
          <h1>Подадени сигнали</h1>
          <p className="arep-subtitle">Преглед на сигнали от живущите</p>
        </div>
        <div className="arep-header-right">
          <div style={{ width: "250px" }}>
            <Select
              options={buildingOptions}
              value={buildingOptions.find((o) => o.value === selectedBuilding)}
              onChange={(opt) => setSelectedBuilding(opt ? opt.value : "all")}
              styles={customSelectStyles}
              placeholder="Избери сграда..."
              isSearchable={true}
            />
          </div>
        </div>
      </div>

      <div className="arep-toolbar">
        <h3>Списък сигнали</h3>
        <div className="arep-filters-right">
          <label className="arep-toggle-container">
            <input
              type="checkbox"
              checked={showPastReports}
              onChange={() => setShowPastReports(!showPastReports)}
            />
            <span className="arep-toggle-slider"></span>
            <span className="arep-toggle-label">Показвай приключени</span>
          </label>
        </div>
      </div>

      {loadingReports ? (
        <div className="arep-loading">
          <span className="arep-spinner">↻</span> Зареждане...
        </div>
      ) : (
        <>
          <table className="arep-table">
            <thead>
              <tr>
                <th>№</th>
                <th>Адрес</th>
                <th>Състояние</th>
                <th>Относно</th>
                <th>Обновено</th>
                <th>Подадено</th>
                <th>От кого</th>
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 ? (
                <tr>
                  <td colSpan="7" className="arep-no-data">
                    Няма намерени сигнали.
                  </td>
                </tr>
              ) : (
                reports.map((report, idx) => (
                  <tr
                    key={report.id}
                    onClick={() => navigate(`/admin/report/${report.id}`)}
                    className="arep-row"
                  >
                    <td className="arep-idx">
                      {(currentPage - 1) * pageSize + idx + 1}
                    </td>

                    <td data-label="Адрес" className="arep-address">
                      {report.building?.name}
                    </td>

                    <td data-label="Състояние">
                      <span
                        className={`arep-badge ${getStatusClass(
                          report.status
                        )}`}
                      >
                        {report.status}
                      </span>
                    </td>

                    <td data-label="Относно" className="arep-subject">
                      {report.subject}
                    </td>

                    <td data-label="Обновено">
                      {formatDateTime(report.updated_at)}
                    </td>

                    <td data-label="Подадено">
                      {formatDateTime(report.created_at)}
                    </td>

                    <td data-label="Подал">
                      {report.submitted_by
                        ? `${report.submitted_by.first_name} ${report.submitted_by.last_name}`
                        : "Анонимен"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="arep-pagination">
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

export default AdminReports;
