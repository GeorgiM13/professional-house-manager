import { useState, useEffect, useMemo } from "react";
import Select from "react-select";
import { useTheme } from "../../../components/ThemeContext";
import {
  X,
  FileSpreadsheet,
  CheckCircle2,
  Loader2,
  Building2,
  CalendarDays,
  Download,
} from "lucide-react";

import { generateFeeExcelReport } from "./utils/FeeExcelExportGenerator";
import Swal from "sweetalert2";
import { supabase } from "../../../supabaseClient";
import "./styles/FeeExportModal.css";

function FeeExportModal({
  isOpen,
  onClose,
  selectedBuilding,
  selectedYear,
  selectedMonth,
}) {
  const { isDarkMode } = useTheme();

  const [exportType, setExportType] = useState("current");

  const [startMonth, setStartMonth] = useState(null);
  const [startYear, setStartYear] = useState(null);
  const [endMonth, setEndMonth] = useState(null);
  const [endYear, setEndYear] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const monthOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        value: i + 1,
        label: new Date(2000, i)
          .toLocaleString("bg-BG", { month: "long" })
          .replace(/^./, (str) => str.toUpperCase()),
      })),
    [],
  );

  const yearOptions = useMemo(
    () =>
      Array.from({ length: 15 }, (_, i) => {
        const y = new Date().getFullYear() - i;
        return { value: y, label: String(y) };
      }),
    [],
  );

  const selectStyles = useMemo(
    () => ({
      menuPortal: (base) => ({ ...base, zIndex: 106005 }),
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
        boxShadow: state.isFocused
          ? "0 0 0 3px rgba(59, 130, 246, 0.1)"
          : "none",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }),
      menu: (base) => ({
        ...base,
        backgroundColor: isDarkMode ? "#1e293b" : "white",
        border: isDarkMode ? "1px solid #334155" : "none",
        zIndex: 106005,
      }),
      menuList: (base) => ({
        ...base,
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        "::-webkit-scrollbar": {
          display: "none",
        },
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
        fontFamily: "system-ui, -apple-system, sans-serif",
      }),
      singleValue: (base) => ({
        ...base,
        color: isDarkMode ? "#f1f5f9" : "#4a5568",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }),
      input: (base) => ({
        ...base,
        color: isDarkMode ? "#f1f5f9" : "#4a5568",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }),
      placeholder: (base) => ({
        ...base,
        color: isDarkMode ? "#94a3b8" : "#a0aec0",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }),
    }),
    [isDarkMode],
  );

  useEffect(() => {
    if (isOpen) {
      setExportType("current");
      setStartMonth(null);
      setStartYear(null);
      setEndMonth(null);
      setEndYear(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains("fee-export-overlay") && !isSubmitting) {
      onClose();
    }
  };

  const getMonthNameBG = (monthNum) => {
    if (!monthNum) return "";
    const date = new Date(2000, monthNum - 1, 1);
    const monthStr = date.toLocaleString("bg-BG", { month: "long" });
    return monthStr.charAt(0).toUpperCase() + monthStr.slice(1);
  };

  const handleExport = async () => {
    setIsSubmitting(true);

    try {
      if (!selectedBuilding || selectedBuilding.value === "all") {
        throw new Error("Моля, изберете конкретна сграда от главното меню.");
      }

      const exportParams = {
        supabase: supabase,
        buildingId: selectedBuilding.value,
        exportType: exportType,
        currentMonth: selectedMonth,
        currentYear: selectedYear,
        startMonth: startMonth?.value,
        startYear: startYear?.value,
        endMonth: endMonth?.value,
        endYear: endYear?.value,
      };

      await generateFeeExcelReport(exportParams);

      onClose();
    } catch (error) {
      Swal.fire({
        title: "Грешка",
        text: error.message || "Възникна проблем при генерирането на файла.",
        icon: "error",
        customClass: { container: "fee-export-swal-container" },
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  if (!isOpen) return null;

  return (
    <div
      className={`fee-export-overlay ${isDarkMode ? "fee-export-dark" : "fee-export-light"}`}
      onClick={handleOverlayClick}
    >
      <div className="fee-export-content">
        <div className="fee-export-header">
          <div className="fee-export-header-top">
            <span className="fee-export-badge">ЕКСПОРТ НА ТАКСИ</span>
            <button
              className="fee-export-close"
              onClick={onClose}
              disabled={isSubmitting}
            >
              <X size={24} strokeWidth={2.5} />
            </button>
          </div>
          <h1 className="fee-export-title">
            <FileSpreadsheet size={22} className="fee-export-icon-main" />{" "}
            Справки в Excel
          </h1>
        </div>

        <div className="fee-export-body">
          <div className="fee-export-info-panel">
            <div className="fee-export-info-col">
              <span className="fee-export-info-label">Избрана сграда:</span>
              <span className="fee-export-info-value">
                <Building2 size={16} />
                {selectedBuilding && selectedBuilding.value !== "all"
                  ? selectedBuilding.label.split(",")[0]
                  : "Всички сгради"}
              </span>
            </div>
            <div className="fee-export-info-col fee-export-border-left">
              <span className="fee-export-info-label">Текущ период:</span>
              <span className="fee-export-info-value">
                <CalendarDays size={16} /> {getMonthNameBG(selectedMonth)}{" "}
                {selectedYear} г.
              </span>
            </div>
          </div>

          <div className="fee-export-form">
            <label className="fee-export-label fee-export-margin-bottom">
              Обхват на справката
            </label>
            <div className="fee-export-radio-cards">
              <div
                className={`fee-export-radio-card ${exportType === "current" ? "active" : ""}`}
                onClick={() => !isSubmitting && setExportType("current")}
              >
                <div className="radio-header">
                  <div className="radio-circle">
                    {exportType === "current" && (
                      <CheckCircle2 size={14} strokeWidth={3} />
                    )}
                  </div>
                  <span className="radio-title">Само текущия месец</span>
                </div>
                <p className="radio-desc">
                  Генерира справка само за{" "}
                  {getMonthNameBG(selectedMonth).toLowerCase()} {selectedYear}{" "}
                  г.
                </p>
              </div>

              <div
                className={`fee-export-radio-card ${exportType === "period" ? "active" : ""}`}
                onClick={() => !isSubmitting && setExportType("period")}
              >
                <div className="radio-header">
                  <div className="radio-circle">
                    {exportType === "period" && (
                      <CheckCircle2 size={14} strokeWidth={3} />
                    )}
                  </div>
                  <span className="radio-title">За конкретен период</span>
                </div>
                <p className="radio-desc">Изберете начален и краен месец</p>
              </div>
            </div>

            {exportType === "period" && (
              <div
                className="fee-export-period-box"
                style={{ flexDirection: "column" }}
              >
                <div className="fee-export-field-group">
                  <label className="fee-export-label">
                    Начален месец и година:
                  </label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <div style={{ flex: 3 }}>
                      <Select
                        options={monthOptions}
                        value={startMonth}
                        onChange={setStartMonth}
                        placeholder="Месец"
                        styles={selectStyles}
                        isDisabled={isSubmitting}
                        isSearchable={false}
                        menuPortalTarget={document.body}
                      />
                    </div>
                    <div style={{ flex: 2 }}>
                      <Select
                        options={yearOptions}
                        value={startYear}
                        onChange={setStartYear}
                        placeholder="Година"
                        styles={selectStyles}
                        isDisabled={isSubmitting}
                        isSearchable={false}
                        menuPortalTarget={document.body}
                      />
                    </div>
                  </div>
                </div>

                <div
                  className="fee-export-field-group"
                  style={{ marginTop: "8px" }}
                >
                  <label className="fee-export-label">
                    Краен месец и година:
                  </label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <div style={{ flex: 3 }}>
                      <Select
                        options={monthOptions}
                        value={endMonth}
                        onChange={setEndMonth}
                        placeholder="Месец"
                        styles={selectStyles}
                        isDisabled={isSubmitting}
                        isSearchable={false}
                        menuPortalTarget={document.body}
                      />
                    </div>
                    <div style={{ flex: 2 }}>
                      <Select
                        options={yearOptions}
                        value={endYear}
                        onChange={setEndYear}
                        placeholder="Година"
                        styles={selectStyles}
                        isDisabled={isSubmitting}
                        isSearchable={false}
                        menuPortalTarget={document.body}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              className="fee-export-submit-btn"
              onClick={handleExport}
              disabled={
                isSubmitting ||
                (exportType === "period" &&
                  (!startMonth || !startYear || !endMonth || !endYear))
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="fee-export-spin" size={20} /> Генериране
                  на Excel...
                </>
              ) : (
                <>
                  <Download size={20} /> Свали документа
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FeeExportModal;
