import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Select from "react-select";
import { supabase } from "../supabaseClient";
import { useUserBuildings } from "./hooks/useUserBuildings";
import { useLocalUser } from "./hooks/useLocalUser";
import { useTheme } from "../components/ThemeContext";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Building,
  Building2,
  Inbox,
  Plus,
} from "lucide-react";
import AddUserReport from "./subpages/AddUserReport";
import UserReportDetails from "./subpages/UserReportDetails";
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

function UserReports() {
  const navigate = useNavigate();
  const { userId } = useLocalUser();
  const { isDarkMode } = useTheme();
  const { buildings, loading: loadingBuildings } = useUserBuildings(userId);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const buildingOptions = useMemo(
    () => [
      { value: "all", label: "Всички мои сгради", iconType: "building" },
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
      <div className="urep-select-item flex-align">
        {shouldShowIcon && (
          <Icon size={16} strokeWidth={2.5} className="urep-select-icon" />
        )}
        <span>{label}</span>
      </div>
    );
  };

  useEffect(() => {
    if (buildings.length === 1) {
      setSelectedBuilding(buildings[0].id);
    }
  }, [buildings]);

  const fetchReports = useCallback(async () => {
    if (!userId && !loadingBuildings) return;

    setLoadingReports(true);
    try {
      let query = supabase
        .from("reports")
        .select(
          `
          id, status, subject, description, notes, created_at, updated_at, building_id,
          building:building_id(name,address)
        `,
        )
        .eq("submitted_by", userId)
        .order("created_at", { ascending: false });

      if (selectedBuilding !== "all") {
        query = query.eq("building_id", selectedBuilding);
      } else if (buildings.length > 0) {
        query = query.in(
          "building_id",
          buildings.map((b) => b.id),
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
  }, [userId, selectedBuilding, buildings, loadingBuildings]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const paginatedReports = reports.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
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

        <div className="urep-header-right flex-align">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="urep-add-btn flex-align"
          >
            <Plus size={18} strokeWidth={2.5} /> Подай сигнал
          </button>

          {buildings.length > 1 ? (
            <div className="urep-select-wrapper">
              <Select
                options={buildingOptions}
                value={getSelectValue(buildingOptions, selectedBuilding)}
                onChange={(opt) => setSelectedBuilding(opt ? opt.value : "all")}
                formatOptionLabel={customFormatOptionLabel}
                placeholder="Изберете сграда"
                isSearchable={false}
                className="react-select-container"
                classNamePrefix="react-select"
              />
            </div>
          ) : (
            buildings.length === 1 && (
              <div className="urep-single-building flex-align">
                <Building size={18} strokeWidth={2.5} /> {buildings[0].name}
              </div>
            )
          )}
        </div>
      </div>

      {loadingReports ? (
        <div className="urep-loading flex-align flex-center">
          <Loader2 className="urep-spinner" size={24} strokeWidth={2.5} />{" "}
          Зареждане...
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
                    <Inbox
                      className="urep-empty-icon"
                      size={48}
                      strokeWidth={2}
                    />
                    Няма подадени сигнали.
                  </td>
                </tr>
              ) : (
                paginatedReports.map((report, idx) => (
                  <tr
                    key={report.id}
                    onClick={() => {
                      setSelectedReportId(report.id);
                      setIsDetailsModalOpen(true);
                    }}
                    className="urep-row"
                  >
                    <td className="urep-idx">
                      {(currentPage - 1) * pageSize + idx + 1}
                    </td>

                    <td data-label="Сграда" className="urep-address">
                      <Building2
                        size={16}
                        strokeWidth={2.5}
                        className="urep-mobile-icon"
                      />
                      <span>{report.building?.name}</span>
                    </td>

                    <td data-label="Статус">
                      <span
                        className={`urep-badge ${getStatusClass(
                          report.status,
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
            <div className="urep-pagination flex-align flex-center">
              <button
                className="flex-align"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                <ChevronLeft size={18} strokeWidth={2.5} />{" "}
                <span className="urep-pag-text">Предишна</span>
              </button>
              <span className="urep-pag-info">
                Страница {currentPage} от {totalPages}
              </span>
              <button
                className="flex-align"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                <span className="urep-pag-text">Следваща</span>{" "}
                <ChevronRight size={18} strokeWidth={2.5} />
              </button>
            </div>
          )}

          <UserReportDetails
            isOpen={isDetailsModalOpen}
            onClose={() => setIsDetailsModalOpen(false)}
            reportId={selectedReportId}
          />
          <AddUserReport
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onSuccess={() => {
              fetchReports();
            }}
          />
        </>
      )}
    </div>
  );
}

export default UserReports;
