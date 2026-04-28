import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import { supabase } from "../supabaseClient";
import { useUserBuildings } from "./hooks/UseUserBuildings";
import { useLocalUser } from "./hooks/UseLocalUser";
import { useTheme } from "../components/ThemeContext";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Building,
  Building2,
  User,
  Inbox,
} from "lucide-react";
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

  const customFormatOptionLabel = ({ label, iconType }, { context }) => {
    let Icon = null;
    if (iconType === "building") Icon = Building;

    const shouldShowIcon = Icon && context === "value";

    return (
      <div className="arep-select-item">
        {shouldShowIcon && (
          <Icon size={16} strokeWidth={2.5} className="arep-select-icon" />
        )}
        <span>{label}</span>
      </div>
    );
  };

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
            { count: "exact" },
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
            buildings.map((b) => b.id),
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
          <div className="arep-select-wrapper">
            <Select
              options={buildingOptions}
              value={buildingOptions.find((o) => o.value === selectedBuilding)}
              onChange={(opt) => setSelectedBuilding(opt ? opt.value : "all")}
              placeholder="Избери сграда..."
              isSearchable={true}
              formatOptionLabel={customFormatOptionLabel}
              className="react-select-container"
              classNamePrefix="react-select"
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

      <div className="arep-table-wrapper">
        {loadingReports ? (
          <div className="arep-loading arep-flex-align arep-flex-center">
            <Loader2 className="arep-spinner" size={24} strokeWidth={2.5} />
            Зареждане...
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
                      <Inbox
                        className="arep-empty-icon"
                        size={48}
                        strokeWidth={2}
                      />
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
                        <Building2
                          size={16}
                          strokeWidth={2.5}
                          className="arep-mobile-icon"
                        />
                        <span>{report.building?.name}</span>
                      </td>

                      <td data-label="Състояние">
                        <span
                          className={`arep-badge ${getStatusClass(
                            report.status,
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

                      <td data-label="Подал" className="arep-user-cell">
                        <User
                          size={16}
                          strokeWidth={2.5}
                          className="arep-mobile-icon"
                        />
                        <span>
                          {report.submitted_by
                            ? `${report.submitted_by.first_name} ${report.submitted_by.last_name}`
                            : "Анонимен"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="arep-pagination">
                <button
                  className="arep-flex-align"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  <ChevronLeft size={18} strokeWidth={2.5} />
                  <span className="arep-pag-text">Предишна</span>
                </button>
                <span className="arep-pag-info">
                  Страница {currentPage} от {totalPages}
                </span>
                <button
                  className="arep-flex-align"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  <span className="arep-pag-text">Следваща</span>
                  <ChevronRight size={18} strokeWidth={2.5} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default AdminReports;
