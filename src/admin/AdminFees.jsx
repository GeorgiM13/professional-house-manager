import { useState, useEffect, useMemo, Fragment } from "react";
import Select from "react-select";
import { supabase } from "../supabaseClient";
import { generateFees } from "../algorithms/fees";
import Swal from "sweetalert2";
import { useUserBuildings } from "./hooks/UseUserBuildings";
import { useLocalUser } from "./hooks/UseLocalUser";
import { useTheme } from "../components/ThemeContext";
import {
  Building2,
  Zap,
  Users,
  CheckCircle2,
  LayoutDashboard,
  List,
  CreditCard,
  X,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Wallet,
  Target,
} from "lucide-react";
import "./styles/AdminFees.css";

const formatObjectName = (type, number) => {
  const t = (type || "").toLowerCase();
  let label = type;

  if (t.includes("ap") || t.includes("ап")) label = "Апартамент";
  else if (t.includes("gar") || t.includes("пар") || t.includes("гараж"))
    label = "Гараж";
  else if (t.includes("off") || t.includes("оф")) label = "Офис";
  else if (
    t.includes("ret") ||
    t.includes("mag") ||
    t.includes("shop") ||
    t.includes("ритейл")
  )
    label = "Ритейл";
  else if (t.includes("ate") || t.includes("ате")) label = "Ателие";

  return `${label} ${number}`;
};

const AnimatedCounter = ({ value, duration = 800 }) => {
  const [count, setCount] = useState(value);
  useEffect(() => {
    let startTimestamp = null;
    const startValue = count;
    const endValue = value;
    if (startValue === endValue) return;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(startValue + (endValue - startValue) * easeOutQuart);
      if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  }, [value]);
  return <>{count.toFixed(2)}</>;
};

const customFormatOptionLabel = ({ label, iconType }, { context }) => {
  let Icon = null;
  if (iconType === "building") Icon = Building2;

  const shouldShowIcon = Icon && context === "value";

  return (
    <div className="af-select-item">
      {shouldShowIcon && (
        <Icon size={16} strokeWidth={2.5} className="af-select-icon" />
      )}
      <span>{label}</span>
    </div>
  );
};

const ITEMS_PER_PAGE = 30;

function AdminFees() {
  const { isDarkMode } = useTheme();
  const { userId } = useLocalUser();
  const { buildings, loading: loadingBuildings } = useUserBuildings(userId);

  const [fees, setFees] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loadingFees, setLoadingFees] = useState(false);

  const [groupByClient, setGroupByClient] = useState(true);
  const [expandedUsers, setExpandedUsers] = useState({});
  const [currentPage, setCurrentPage] = useState(1);

  const [mobileViewMode, setMobileViewMode] = useState("elevator");
  const [selectedFeeForModal, setSelectedFeeForModal] = useState(null);

  const buildingOptions = useMemo(() => {
    const opts = buildings.map((b) => ({
      value: b.id,
      label: `${b.name}, ${b.address}`,
    }));
    return [
      { value: "all", label: "Всички сгради", iconType: "building" },
      ...opts,
    ];
  }, [buildings]);

  const monthOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        value: i + 1,
        label: new Date(0, i).toLocaleString("bg-BG", { month: "long" }),
      })),
    [],
  );

  const yearOptions = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => {
        const y = new Date().getFullYear() - i;
        return { value: y, label: String(y) };
      }),
    [],
  );

  useEffect(() => {
    if (!selectedBuilding && buildingOptions.length > 0) {
      setSelectedBuilding(buildingOptions[0]);
    }
  }, [buildingOptions]);

  useEffect(() => {
    if (selectedBuilding && selectedMonth && selectedYear) {
      fetchFees(selectedBuilding.value, selectedMonth, selectedYear);
    } else {
      setFees([]);
    }
    setCurrentPage(1);
  }, [selectedBuilding, selectedMonth, selectedYear]);

  const fetchFees = async (buildingId, month, year) => {
    setLoadingFees(true);

    let query = supabase.from("fees").select(`
        id, building_id, client_id, object_number, type, floor,
        month, year, current_month_due, total_due, paid,
        users ( id, first_name, second_name, last_name )
      `);

    if (buildingId !== "all") {
      query = query.eq("building_id", buildingId);
    }

    query = query.or(`year.lt.${year},and(year.eq.${year},month.lte.${month})`);

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching fees:", error);
    } else {
      setFees(data || []);
    }
    setLoadingFees(false);
  };

  const handleGenerateFees = async () => {
    if (!selectedBuilding) return alert("Моля, изберете сграда.");

    if (selectedBuilding.value === "all") {
      return Swal.fire(
        "Внимание",
        "Моля, изберете конкретна сграда, за да генерирате такси.",
        "warning",
      );
    }

    try {
      const { data: building, error } = await supabase
        .from("buildings")
        .select("fee_algorithm")
        .eq("id", selectedBuilding.value)
        .single();

      if (error) throw error;
      const algorithmType = building?.fee_algorithm || "base";

      const count = await generateFees(
        selectedBuilding.value,
        selectedMonth,
        selectedYear,
        algorithmType,
      );

      alert(`✅ Генерирани са ${count} такси (${algorithmType}).`);
      await fetchFees(selectedBuilding.value, selectedMonth, selectedYear);
    } catch (err) {
      alert("⚠️ " + err.message);
    }
  };

  const payCurrent = async (fee) => {
    const currentPaid = Number(fee.paid || 0);
    const toPay = Number(fee.current_month_due || 0);
    const total = Number(fee.total_due || 0);
    const amountToPay = Math.min(toPay, total - currentPaid);

    if (amountToPay <= 0) {
      return Swal.fire(
        "Информация",
        "Този месец вече е платен или няма задължение.",
        "info",
      );
    }

    const objectName = formatObjectName(fee.type, fee.object_number);

    const result = await Swal.fire({
      title: "Плащане на текуща сметка",
      text: `Потвърждавате ли плащане на сума от ${amountToPay.toFixed(
        2,
      )} лв. за ${objectName}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3b82f6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Да, плати",
      cancelButtonText: "Отказ",
    });

    if (!result.isConfirmed) return;

    const newPaid = currentPaid + amountToPay;
    const { error } = await supabase
      .from("fees")
      .update({ paid: newPaid })
      .eq("id", fee.id);
    if (!error) {
      Swal.fire({
        title: "Успешно!",
        icon: "success",
        timer: 1000,
        showConfirmButton: false,
      });
      refreshDataAfterPay(fee.id);
    }
  };

  const payAll = async (fee) => {
    const { totalRem } = getFeeStatus(fee);

    if (totalRem <= 0) {
      return Swal.fire("Информация", "Няма задължения за погасяване.", "info");
    }

    const objectName = formatObjectName(fee.type, fee.object_number);

    const result = await Swal.fire({
      title: "Пълно погасяване",
      text: `Потвърждавате ли плащане на ЦЯЛАТА сума от ${totalRem.toFixed(
        2,
      )} лв. за ${objectName}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#d33",
      confirmButtonText: "Да, изчисти всичко",
      cancelButtonText: "Отказ",
    });

    if (!result.isConfirmed) return;

    const { error } = await supabase.rpc("pay_all_fees_for_object", {
      p_building_id: fee.building_id,
      p_client_id: fee.client_id,
      p_object_number: fee.object_number,
      p_type: fee.type,
      p_floor: fee.floor,
      p_year: selectedYear,
      p_month: selectedMonth,
    });
    if (!error) {
      Swal.fire({
        title: "Успешно!",
        icon: "success",
        timer: 1000,
        showConfirmButton: false,
      });
      refreshDataAfterPay(fee.id);
    }
  };

  const refreshDataAfterPay = (feeId) => {
    fetchFees(selectedBuilding.value, selectedMonth, selectedYear);
    if (selectedFeeForModal && selectedFeeForModal.id === feeId)
      setSelectedFeeForModal(null);
  };

  const getObjectKey = (row) =>
    `${row.client_id}|${row.object_number}|${row.type}`;

  const currentFees = useMemo(
    () =>
      fees.filter((f) => f.month === selectedMonth && f.year === selectedYear),
    [fees, selectedMonth, selectedYear],
  );

  const remainingByObject = useMemo(() => {
    const map = {};
    const historyMap = {};
    fees.forEach((row) => {
      const key = getObjectKey(row);
      if (!historyMap[key]) historyMap[key] = [];
      historyMap[key].push(row);
    });
    Object.entries(historyMap).forEach(([key, historyRows]) => {
      const totalDebt = historyRows.reduce((acc, r) => {
        const t = Number(r.total_due || 0);
        const p = Number(r.paid || 0);
        return acc + Math.max(t - p, 0);
      }, 0);
      map[key] = totalDebt;
    });
    return map;
  }, [fees]);

  const sortedFees = useMemo(() => {
    return [...currentFees].sort((a, b) => {
      const floorA =
        a.floor === null || a.floor === "" || isNaN(Number(a.floor))
          ? 9999
          : Number(a.floor);
      const floorB =
        b.floor === null || b.floor === "" || isNaN(Number(b.floor))
          ? 9999
          : Number(b.floor);
      if (floorA !== floorB) return floorA - floorB;

      const numA =
        parseFloat(String(a.object_number).replace(/[^\d.-]/g, "")) || 0;
      const numB =
        parseFloat(String(b.object_number).replace(/[^\d.-]/g, "")) || 0;
      if (numA !== numB) return numA - numB;

      return String(a.object_number).localeCompare(
        String(b.object_number),
        "bg",
        { numeric: true },
      );
    });
  }, [currentFees]);

  const userGroups = useMemo(() => {
    const map = new Map();
    sortedFees.forEach((fee) => {
      const key = fee.client_id || "no-client";
      if (!map.has(key)) {
        const user = fee.users;
        const name = user
          ? `${user.first_name} ${user.last_name}`
          : "Без клиент";
        map.set(key, { clientId: key, name, rows: [] });
      }
      map.get(key).rows.push(fee);
    });
    return Array.from(map.values());
  }, [sortedFees]);

  const feesByFloor = useMemo(() => {
    const floors = {};
    sortedFees.forEach((fee) => {
      let floorKey = fee.floor;
      if (floorKey === null || floorKey === undefined || floorKey === "")
        floorKey = "Други";
      if (!floors[floorKey]) floors[floorKey] = [];
      floors[floorKey].push(fee);
    });
    return Object.entries(floors).sort((a, b) => {
      const nA = Number(a[0]),
        nB = Number(b[0]);
      if (!isNaN(nA) && !isNaN(nB)) return nA - nB;
      if (!isNaN(nA)) return -1;
      if (!isNaN(nB)) return 1;
      return a[0].localeCompare(b[0]);
    });
  }, [sortedFees]);

  const stats = useMemo(() => {
    let toCollect = 0,
      collected = 0;
    currentFees.forEach((f) => {
      toCollect += Number(f.current_month_due || 0);
      collected += Number(f.paid || 0);
    });
    const progress = toCollect > 0 ? (collected / toCollect) * 100 : 0;
    return { toCollect, collected, progress };
  }, [currentFees]);

  const getFeeStatus = (fee) => {
    const key = getObjectKey(fee);
    const totalRem = remainingByObject[key] || 0;
    const rowRem = Math.max(
      Number(fee.total_due || 0) - Number(fee.paid || 0),
      0,
    );
    const isPaidCurrent = rowRem < 0.01;
    const isFullyPaid = totalRem < 0.01;

    let status = "pending";
    if (isFullyPaid) status = "clean";
    else if (totalRem > rowRem + 0.1) status = "debt";

    return { status, totalRem, rowRem, isPaidCurrent, isFullyPaid };
  };

  const dataToPaginate = groupByClient ? userGroups : sortedFees;
  const totalPages = Math.ceil(dataToPaginate.length / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return dataToPaginate.slice(start, start + ITEMS_PER_PAGE);
  }, [dataToPaginate, currentPage]);

  const PaginationControls = () =>
    totalPages > 1 && (
      <div className="af-pagination">
        <button
          className="af-flex-align af-flex-center"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => p - 1)}
        >
          <ChevronLeft size={18} strokeWidth={2.5} />
          <span className="af-pag-text">Предишна</span>
        </button>
        <span className="af-pag-info">
          Страница {currentPage} от {totalPages}
        </span>
        <button
          className="af-flex-align af-flex-center"
          disabled={currentPage >= totalPages}
          onClick={() => setCurrentPage((p) => p + 1)}
        >
          <span className="af-pag-text">Следваща</span>
          <ChevronRight size={18} strokeWidth={2.5} />
        </button>
      </div>
    );

  const renderRow = (fee) => {
    const { status, totalRem, isPaidCurrent, isFullyPaid } = getFeeStatus(fee);
    const currentDue = Number(fee.current_month_due || 0);
    let debtClass = isFullyPaid
      ? "val-green"
      : status === "debt"
        ? "val-red"
        : "val-orange";

    return (
      <tr key={fee.id} className="af-row">
        <td data-label="Обект" className="fw-bold">
          {fee.object_number}
        </td>
        <td data-label="Вид" className="text-sec">
          {fee.type}
        </td>
        <td data-label="Етаж">{fee.floor || "-"}</td>
        <td data-label="Клиент">
          {fee.users ? (
            `${fee.users.first_name} ${fee.users.last_name}`
          ) : (
            <span className="text-italic">Няма</span>
          )}
        </td>
        <td data-label="Текуща" className="text-right num-font">
          {currentDue.toFixed(2)} лв.
        </td>
        <td
          data-label="Дължи"
          className={`text-right num-font ${debtClass} fw-bold`}
        >
          {totalRem.toFixed(2)} лв.
        </td>
        <td data-label="Статус" className="text-center">
          <span className={`af-badge ${isPaidCurrent ? "paid" : "unpaid"}`}>
            {isPaidCurrent ? "Платено" : "Неплатено"}
          </span>
        </td>
        <td data-label="Действия" className="af-actions-cell">
          {!isPaidCurrent && (
            <button
              className="af-btn-small sec"
              onClick={() => payCurrent(fee)}
            >
              Текущо
            </button>
          )}
          {!isFullyPaid && (
            <button className="af-btn-small prim" onClick={() => payAll(fee)}>
              Всичко
            </button>
          )}
          {isFullyPaid && (
            <CheckCircle2 size={20} strokeWidth={2.5} className="val-green" />
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className={`af-page ${isDarkMode ? "af-dark" : "af-light"}`}>
      <div className="af-toolbar">
        <div className="af-toolbar-top">
          <div className="af-toolbar-title">
            <h1>Управление на такси</h1>
            <p className="desktop-only">Финансов статус</p>
          </div>
          <label className="af-switch desktop-view" title="Групирай по клиенти">
            <input
              type="checkbox"
              checked={groupByClient}
              onChange={() => setGroupByClient(!groupByClient)}
            />
            <span className="af-slider"></span>
            <span className="switch-text">Групи</span>
          </label>
        </div>

        <div className="af-toolbar-controls">
          <div className="af-control-item building-select">
            <Select
              options={buildingOptions}
              value={selectedBuilding}
              onChange={setSelectedBuilding}
              classNamePrefix="react-select"
              className="react-select-container"
              placeholder="Изберете сграда..."
              isLoading={loadingBuildings}
              isSearchable={true}
              formatOptionLabel={customFormatOptionLabel}
              noOptionsMessage={() => "Няма намерена сграда"}
            />
          </div>

          <div className="af-date-group">
            <div className="af-date-select-wrapper month">
              <Select
                options={monthOptions}
                value={monthOptions.find((m) => m.value === selectedMonth)}
                onChange={(op) => setSelectedMonth(op.value)}
                classNamePrefix="react-select"
                className="react-select-container"
                isSearchable={false}
                placeholder="Месец"
              />
            </div>
            <div className="af-date-select-wrapper year">
              <Select
                options={yearOptions}
                value={yearOptions.find((y) => y.value === selectedYear)}
                onChange={(op) => setSelectedYear(op.value)}
                classNamePrefix="react-select"
                className="react-select-container"
                isSearchable={false}
                placeholder="Година"
              />
            </div>

            <button
              className="af-main-btn af-flex-align"
              onClick={handleGenerateFees}
            >
              <span className="desktop-view">Генерирай</span>
              <span className="mobile-view">
                <Zap size={18} strokeWidth={2.5} />
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="af-stats-grid">
        <div className="af-stat-card blue">
          <div className="af-stat-icon icon-blue">
            <CircleDollarSign size={24} strokeWidth={2.5} />
          </div>
          <div className="af-stat-info">
            <div className="label">Очаквани</div>
            <div className="value">
              <AnimatedCounter value={stats.toCollect} /> <small>лв.</small>
            </div>
          </div>
        </div>
        <div className="af-stat-card green">
          <div className="af-stat-icon icon-green">
            <Wallet size={24} strokeWidth={2.5} />
          </div>
          <div className="af-stat-info">
            <div className="label">Събрани</div>
            <div className="value">
              <AnimatedCounter value={stats.collected} /> <small>лв.</small>
            </div>
          </div>
        </div>
        <div className="af-stat-card progress-card purple">
          <div className="af-stat-icon icon-purple">
            <Target size={24} strokeWidth={2.5} />
          </div>
          <div className="af-stat-info" style={{ width: "100%" }}>
            <div className="label">Успеваемост</div>
            <div className="af-progress-wrap">
              <div className="value">
                <AnimatedCounter value={stats.progress} />%
              </div>
              <div className="af-progress-bar">
                <div
                  className="fill"
                  style={{ width: `${stats.progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="af-view-controls mobile-view">
        <div className="af-view-toggle-group">
          <button
            className={`af-vt-btn af-flex-align ${
              mobileViewMode === "elevator" ? "active" : ""
            }`}
            onClick={() => setMobileViewMode("elevator")}
            type="button"
          >
            <LayoutDashboard size={16} strokeWidth={2.5} /> Панел
          </button>
          <button
            className={`af-vt-btn af-flex-align ${mobileViewMode === "list" ? "active" : ""}`}
            onClick={() => setMobileViewMode("list")}
            type="button"
          >
            <List size={16} strokeWidth={2.5} /> Списък
          </button>
        </div>
        <div className="af-view-info">
          {mobileViewMode === "elevator"
            ? `${fees.length} обекта`
            : `${userGroups.length} клиента`}
        </div>
      </div>

      <div className="af-table-wrapper desktop-view">
        {loadingFees ? (
          <div className="af-loading">Зареждане...</div>
        ) : (
          <>
            <table className="af-table">
              <thead>
                <tr>
                  <th>Обект</th>
                  <th>Вид</th>
                  <th>Етаж</th>
                  <th>Клиент</th>
                  <th className="text-right">Текуща</th>
                  <th className="text-right">Общо</th>
                  <th className="text-center">Статус</th>
                  <th className="text-right">Действие</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center p-4">
                      Няма данни
                    </td>
                  </tr>
                ) : groupByClient ? (
                  paginatedData.map((group) => {
                    const groupTotal = group.rows.reduce(
                      (sum, r) =>
                        sum + (remainingByObject[getObjectKey(r)] || 0),
                      0,
                    );
                    return (
                      <Fragment key={group.clientId}>
                        <tr
                          className="af-group-header"
                          onClick={() =>
                            setExpandedUsers((p) => ({
                              ...p,
                              ...(!p[group.clientId]
                                ? { [group.clientId]: true }
                                : { [group.clientId]: false }),
                            }))
                          }
                        >
                          <td colSpan="8">
                            <div className="af-group-content">
                              <Users
                                size={18}
                                strokeWidth={2.5}
                                className="af-text-sec"
                              />{" "}
                              {group.name}
                              <span className="count-badge">
                                {group.rows.length} обекта
                              </span>
                              {groupTotal > 0 && (
                                <span className="group-total-right">
                                  Дължи: {groupTotal.toFixed(2)} лв.
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                        {expandedUsers[group.clientId] &&
                          group.rows.map(renderRow)}
                      </Fragment>
                    );
                  })
                ) : (
                  paginatedData.map(renderRow)
                )}
              </tbody>
            </table>
            <PaginationControls />
          </>
        )}
      </div>

      <div className="af-mobile-content mobile-view">
        {mobileViewMode === "elevator" ? (
          <div className="af-elevator-view">
            {feesByFloor.map(([floor, floorFees]) => (
              <div key={floor} className="af-floor-section">
                <h3 className="af-floor-title">
                  {isNaN(floor) ? floor : `Етаж ${floor}`}
                </h3>
                <div className="af-unit-grid">
                  {floorFees.map((fee) => {
                    const { status } = getFeeStatus(fee);
                    return (
                      <button
                        key={fee.id}
                        className={`af-unit-btn ${status}`}
                        onClick={() => setSelectedFeeForModal(fee)}
                        type="button"
                      >
                        <span className="u-num">{fee.object_number}</span>
                        <span className="u-type">
                          {fee.type.substring(0, 3)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="af-client-list-view">
            {userGroups.map((group) => {
              const groupTotal = group.rows.reduce(
                (sum, r) => sum + (remainingByObject[getObjectKey(r)] || 0),
                0,
              );
              const isExpanded = expandedUsers[group.clientId];
              return (
                <div key={group.clientId} className="af-mobile-card">
                  <div
                    className="af-m-card-header"
                    onClick={() =>
                      setExpandedUsers((p) => ({
                        ...p,
                        [group.clientId]: !isExpanded,
                      }))
                    }
                  >
                    <div className="af-m-name">{group.name}</div>
                    <div className="af-m-meta">
                      {groupTotal > 0 && (
                        <span className="af-m-debt">
                          {groupTotal.toFixed(0)} лв.
                        </span>
                      )}
                      <span className="arrow">
                        {isExpanded ? (
                          <ChevronRight
                            size={18}
                            strokeWidth={2.5}
                            style={{ transform: "rotate(90deg)" }}
                          />
                        ) : (
                          <ChevronRight size={18} strokeWidth={2.5} />
                        )}
                      </span>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="af-m-card-body">
                      {group.rows.map((fee) => {
                        const { status, totalRem } = getFeeStatus(fee);
                        return (
                          <div
                            key={fee.id}
                            className="af-m-row"
                            onClick={() => setSelectedFeeForModal(fee)}
                            role="button"
                            tabIndex={0}
                          >
                            <div className="af-m-row-main">
                              <span className={`dot ${status}`}></span>
                              <span className="obj-name">
                                {fee.type} {fee.object_number}
                              </span>
                            </div>
                            <div className="af-m-row-right">
                              <span className="af-m-row-val">
                                {totalRem.toFixed(2)} лв.
                              </span>
                              <span className="af-m-action-icon">
                                <CreditCard size={18} strokeWidth={2.5} />
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedFeeForModal && (
        <div
          className="af-modal-overlay"
          onClick={() => setSelectedFeeForModal(null)}
        >
          <div
            className="af-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="af-modal-header">
              <h2>
                {formatObjectName(
                  selectedFeeForModal.type,
                  selectedFeeForModal.object_number,
                )}
              </h2>
              <button
                className="close-btn"
                onClick={() => setSelectedFeeForModal(null)}
                type="button"
              >
                <X size={24} strokeWidth={2.5} />
              </button>
            </div>
            <div className="af-modal-body">
              {(() => {
                const { status, totalRem, rowRem, isPaidCurrent, isFullyPaid } =
                  getFeeStatus(selectedFeeForModal);
                return (
                  <>
                    <div className="info-row">
                      <label>Клиент:</label>{" "}
                      <span>
                        {selectedFeeForModal.users
                          ? `${selectedFeeForModal.users.first_name} ${selectedFeeForModal.users.last_name}`
                          : "Няма"}
                      </span>
                    </div>
                    <div className="debt-box">
                      <div className="debt-lbl">ОБЩО ЗАДЪЛЖЕНИЕ</div>
                      <div className={`debt-val ${status}`}>
                        {totalRem.toFixed(2)} лв.
                      </div>
                    </div>
                    <div className="af-modal-actions">
                      {isFullyPaid ? (
                        <div className="paid-stamp af-flex-align af-flex-center">
                          <CheckCircle2 size={24} strokeWidth={2.5} /> ПЛАТЕНО
                        </div>
                      ) : (
                        <>
                          {!isPaidCurrent && (
                            <button
                              className="modal-btn sec"
                              onClick={() => payCurrent(selectedFeeForModal)}
                              type="button"
                            >
                              Плати текущо ({rowRem.toFixed(2)})
                            </button>
                          )}
                          <button
                            className="modal-btn prim"
                            onClick={() => payAll(selectedFeeForModal)}
                            type="button"
                          >
                            ПЛАТИ ВСИЧКО ({totalRem.toFixed(2)})
                          </button>
                        </>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminFees;
