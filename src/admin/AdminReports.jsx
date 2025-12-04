import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import { supabase } from "../supabaseClient";
import { useUserBuildings } from "./hooks/UseUserBuildings";
import { useLocalUser } from "./hooks/UseLocalUser";
import { useTheme } from "../components/ThemeContext";
import "./styles/AdminReports.css";

const CUSTOM_SELECT_STYLES = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: "var(--arep-bg-card)",
    borderColor: state.isFocused ? "var(--arep-accent)" : "var(--arep-border)",
    borderRadius: "8px",
    color: "var(--arep-text-main)",
    boxShadow: state.isFocused ? "0 0 0 2px var(--arep-accent-light)" : "none",
  }),
  menu: (provided) => ({
    ...provided,
    zIndex: 9999,
    backgroundColor: "var(--arep-bg-card)",
  }),
  singleValue: (provided) => ({ ...provided, color: "var(--arep-text-main)" }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "var(--arep-accent)"
      : state.isFocused
      ? "var(--arep-bg-page)"
      : "transparent",
    color: state.isSelected ? "white" : "var(--arep-text-main)",
    cursor: "pointer",
  }),
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

  const getSelectValue = (options, value) =>
    options.find((o) => String(o.value) === String(value)) || options[0];

  useEffect(() => {
    async function fetchReports() {
      if (!userId && !loadingBuildings) return;

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
          query = query.eq("status", "ново");
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
    userId,
    loadingBuildings,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [showPastReports, selectedBuilding]);

  const totalPages = Math.ceil(totalCount / pageSize);

  function formatDateTime(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day}.${month}.${year} ${hours}:${minutes}`;
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
              value={getSelectValue(buildingOptions, selectedBuilding)}
              onChange={(opt) => setSelectedBuilding(opt ? opt.value : "all")}
              styles={CUSTOM_SELECT_STYLES}
              placeholder="Изберете сграда"
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
            <span className="arep-toggle-label">Показвай стари сигнали</span>
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
                <th>Дата на обновяване</th>
                <th>Дата на подаване</th>
                <th>Подал сигнал</th>
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
                    <td data-label="Адрес">
                      {report.building?.name}, {report.building?.address}
                    </td>
                    <td data-label="Състояние">
                      <span
                        className={`arep-badge ${
                          report.status === "ново"
                            ? "st-new"
                            : report.status === "изпълнено"
                            ? "st-done"
                            : "st-default"
                        }`}
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
                    <td data-label="Създадено">
                      {formatDateTime(report.created_at)}
                    </td>
                    <td data-label="Подал">
                      {report.submitted_by
                        ? `${report.submitted_by.first_name} ${report.submitted_by.last_name}`
                        : "-"}
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