import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import Select from "react-select";
import { supabase } from "../supabaseClient";
import { useUserBuildings } from "./hooks/useUserBuildings";
import { useLocalUser } from "./hooks/useLocalUser";
import { useTheme } from "../components/ThemeContext";
import "./styles/UserReports.css";

const getStatusClass = (status) => {
  if (!status) return "rst-default";
  const s = status.toLowerCase();
  if (s.includes("ново") || s.includes("new")) return "rst-new";
  if (s.includes("изпълнено") || s.includes("done")) return "rst-done";
  if (s.includes("работ") || s.includes("progress")) return "rst-working";
  if (s.includes("отхвърлено") || s.includes("reject")) return "rst-rejected";
  return "rst-default";
};

const CUSTOM_SELECT_STYLES = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: "var(--urep-bg-card)",
    borderColor: state.isFocused ? "var(--urep-accent)" : "var(--urep-border)",
    borderRadius: "8px",
    color: "var(--urep-text-main)",
    boxShadow: state.isFocused ? "0 0 0 2px var(--urep-accent-light)" : "none",
    minHeight: "42px",
  }),
  menu: (provided) => ({
    ...provided,
    zIndex: 9999,
    backgroundColor: "var(--urep-bg-card)",
    border: "1px solid var(--urep-border)",
  }),
  singleValue: (provided) => ({ ...provided, color: "var(--urep-text-main)" }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "var(--urep-accent)"
      : state.isFocused
      ? "var(--urep-bg-page)"
      : "transparent",
    color: state.isSelected ? "white" : "var(--urep-text-main)",
    cursor: "pointer",
  }),
  placeholder: (provided) => ({ ...provided, color: "var(--urep-text-sec)" }),
};

function UserReports() {
  const navigate = useNavigate();
  const { userId } = useLocalUser();
  const { isDarkMode } = useTheme();
  const { buildings, loading: loadingBuildings } = useUserBuildings(userId);

  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const buildingOptions = useMemo(
    () => [
      { value: "all", label: "🏢 Всички мои сгради" },
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

  useEffect(() => {
    async function fetchReports() {
      if (!userId && !loadingBuildings) return;

      setLoadingReports(true);
      try {
        let query = supabase
          .from("reports")
          .select(
            `
            id, status, subject, description, notes, created_at, updated_at, building_id,
            building:building_id(name,address)
          `
          )
          .eq("submitted_by", userId)
          .order("created_at", { ascending: false });

        if (selectedBuilding !== "all") {
          query = query.eq("building_id", selectedBuilding);
        } else if (buildings.length > 0) {
          query = query.in(
            "building_id",
            buildings.map((b) => b.id)
          );
        } else {
          setReports([]);
          setLoadingReports(false);
          return;
        }

        const { data, error } = await query;
        if (error) throw error;
        setReports(data || []);
      } catch (err) {
        console.error("Error fetching reports:", err);
      } finally {
        setLoadingReports(false);
      }
    }

    fetchReports();
  }, [userId, selectedBuilding, buildings, loadingBuildings]);

  const paginatedReports = reports.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  const totalPages = Math.ceil(reports.length / pageSize);

  const formatDateTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString("bg-BG", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSelectValue = (options, value) =>
    options.find((o) => String(o.value) === String(value)) || options[0];

  return (
    <div className={`urep-page ${isDarkMode ? "urep-dark" : "urep-light"}`}>
      <div className="urep-header">
        <div className="urep-header-left">
          <h1>Моите Сигнали</h1>
          <p className="urep-subtitle">
            Следете статуса на подадените от вас сигнали
          </p>
        </div>

        <div className="urep-header-right">
          <Link to="/client/addreport" className="urep-add-btn">
            + Подай сигнал
          </Link>

          {buildings.length > 1 ? (
            <div style={{ width: "250px" }}>
              <Select
                options={buildingOptions}
                value={getSelectValue(buildingOptions, selectedBuilding)}
                onChange={(opt) => setSelectedBuilding(opt ? opt.value : "all")}
                styles={CUSTOM_SELECT_STYLES}
                placeholder="Изберете сграда"
                isSearchable={false}
              />
            </div>
          ) : (
            buildings.length === 1 && (
              <div className="urep-single-building">🏢 {buildings[0].name}</div>
            )
          )}
        </div>
      </div>

      {loadingReports ? (
        <div className="urep-loading">
          <span className="urep-spinner">↻</span> Зареждане...
        </div>
      ) : (
        <>
          <table className="urep-table">
            <thead>
              <tr>
                <th>№</th>
                <th>Сграда</th>
                <th>Статус</th>
                <th>Относно</th>
                <th>Описание</th>
                <th>Създаден</th>
                <th>Обновен</th>
              </tr>
            </thead>
            <tbody>
              {paginatedReports.length === 0 ? (
                <tr>
                  <td colSpan="7" className="urep-no-data">
                    Няма подадени сигнали.
                  </td>
                </tr>
              ) : (
                paginatedReports.map((report, idx) => (
                  <tr
                    key={report.id}
                    onClick={() => navigate(`/client/report/${report.id}`)}
                    className="urep-row"
                  >
                    <td className="urep-idx">
                      {(currentPage - 1) * pageSize + idx + 1}
                    </td>

                    <td data-label="Сграда" style={{ fontWeight: 500 }}>
                      {report.building?.name}
                    </td>

                    <td data-label="Статус">
                      <span
                        className={`urep-badge ${getStatusClass(
                          report.status
                        )}`}
                      >
                        {report.status}
                      </span>
                    </td>

                    <td data-label="Относно" className="urep-subject">
                      {report.subject}
                    </td>

                    <td data-label="Описание" className="urep-desc-cell">
                      {report.description}
                    </td>

                    <td data-label="Създаден">
                      {formatDateTime(report.created_at)}
                    </td>

                    <td data-label="Обновен">
                      {formatDateTime(report.updated_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="urep-pagination">
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

export default UserReports;
