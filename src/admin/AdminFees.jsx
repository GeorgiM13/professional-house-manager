import { useState, useEffect, useMemo, Fragment } from "react";
import Select from "react-select";
import { supabase } from "../supabaseClient";
import { generateFees } from "../algorithms/fees";
import Swal from "sweetalert2";
import { useUserBuildings } from "./hooks/UseUserBuildings";
import { useLocalUser } from "./hooks/UseLocalUser";
import { useTheme } from "../components/ThemeContext";

import { generatePdfDocument } from "./utils/invoiceGenerator";

import {
  Building,
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
  FileText,
  Download,
} from "lucide-react";

import EditFee from "./subpages/EditFee";
import FeeDetails from "./subpages/FeeDetails";
import FeeExportModal from "./subpages/export/FeeExportModal";
import "./styles/AdminFees.css";

const EXCHANGE_RATE = 1.95583;

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
  if (iconType === "building") Icon = Building;

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
  const [selectedFeeForEdit, setSelectedFeeForEdit] = useState(null);

  const [isFeeExportModalOpen, setIsFeeExportModalOpen] = useState(false);

  const selectStyles = useMemo(
    () => ({
      menuPortal: (base) => ({ ...base, zIndex: 1050 }),
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
        zIndex: 1050,
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
        month, year, current_month_due, total_due, paid, management_fee, previous_debt, advance_payment,
        users ( id, first_name, second_name, last_name, company_name, company_eik, company_mol, company_address, is_vat_registered )
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

  const formatDualCurrency = (amount, year) => {
    const numericAmount = Number(amount) || 0;
    let eurValue, bgnValue;

    if (Number(year) < 2026) {
      bgnValue = numericAmount;
      eurValue = numericAmount / EXCHANGE_RATE;
    } else {
      eurValue = numericAmount;
      bgnValue = numericAmount * EXCHANGE_RATE;
    }

    return `${eurValue.toFixed(2)} € / ${bgnValue.toFixed(2)} лв.`;
  };

  const handleGenerateInvoice = async (e, group) => {
    e.stopPropagation();

    const monthLabel =
      monthOptions.find((m) => m.value === selectedMonth)?.label ||
      selectedMonth;

    await generatePdfDocument({
      group,
      selectedBuilding,
      selectedMonth,
      selectedYear,
      monthLabel,
      supabase,
      formatObjectName,
      formatDualCurrency,
    });
  };

  const payCurrent = async (fee) => {
    const currentPaid = Number(fee.paid || 0);
    const currentDue = Number(fee.current_month_due || 0);
    const totalDue = Number(fee.total_due || 0);

    const amountNeeded = Math.max(
      0,
      Math.min(currentDue, totalDue) - currentPaid,
    );

    if (amountNeeded <= 0) {
      return Swal.fire(
        "Информация",
        "Този месец вече е платен или няма текущо задължение.",
        "info",
      );
    }

    const objectName = formatObjectName(fee.type, fee.object_number);

    const result = await Swal.fire({
      title: "Плащане на текуща сметка",
      text: `Потвърждавате ли плащане на сума от ${formatDualCurrency(amountNeeded, selectedYear)} за ${objectName}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3b82f6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Да, плати",
      cancelButtonText: "Отказ",
    });

    if (!result.isConfirmed) return;

    const newPaid = currentPaid + amountNeeded;
    const { error } = await supabase
      .from("fees")
      .update({ paid: newPaid })
      .eq("id", fee.id);

    if (!error) {
      setFees((prevFees) =>
        prevFees.map((f) => (f.id === fee.id ? { ...f, paid: newPaid } : f)),
      );

      Swal.fire({
        title: "Успешно!",
        text: `Платени са ${formatDualCurrency(amountNeeded, selectedYear)}.`,
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });

      if (selectedFeeForModal && selectedFeeForModal.id === fee.id) {
        setSelectedFeeForModal(null);
      }
    }
  };

  const payAll = async (fee) => {
    const totalDue = Number(fee.total_due || 0);
    const paid = Number(fee.paid || 0);
    const totalRem = Math.max(0, totalDue - paid);

    if (totalRem <= 0) {
      return Swal.fire("Информация", "Няма задължения за погасяване.", "info");
    }

    const objectName = formatObjectName(fee.type, fee.object_number);

    const result = await Swal.fire({
      title: "Пълно погасяване",
      text: `Потвърждавате ли плащане на ЦЯЛАТА сума от ${formatDualCurrency(totalRem, selectedYear)} за ${objectName}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#d33",
      confirmButtonText: "Да, изчисти всичко",
      cancelButtonText: "Отказ",
    });

    if (!result.isConfirmed) return;

    try {
      const newPaid = paid + totalRem;
      await supabase.from("fees").update({ paid: newPaid }).eq("id", fee.id);

      setFees((prevFees) =>
        prevFees.map((f) => (f.id === fee.id ? { ...f, paid: newPaid } : f)),
      );

      Swal.fire({
        title: "Успешно!",
        text: `Погасени са задължения на стойност ${formatDualCurrency(totalRem, selectedYear)}.`,
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });

      if (selectedFeeForModal && selectedFeeForModal.id === fee.id) {
        setSelectedFeeForModal(null);
      }
    } catch (error) {
      console.error(error);
      Swal.fire("Грешка", "Проблем при отразяване на плащането.", "error");
    }
  };

  const revertPayment = async (fee) => {
    if (Number(fee.paid || 0) === 0) return;

    const objectName = formatObjectName(fee.type, fee.object_number);

    const result = await Swal.fire({
      title: "Отмяна на плащане",
      text: `Сигурни ли сте, че искате да нулирате плащането за ${objectName}? Записаната платена сума ще бъде премахната.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3b82f6",
      confirmButtonText: "Да, нулирай",
      cancelButtonText: "Отказ",
    });

    if (!result.isConfirmed) return;

    const { error } = await supabase
      .from("fees")
      .update({ paid: 0 })
      .eq("id", fee.id);

    if (!error) {
      setFees((prevFees) =>
        prevFees.map((f) => (f.id === fee.id ? { ...f, paid: 0 } : f)),
      );

      Swal.fire({
        title: "Успешно!",
        text: "Плащането е отменено.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });

      if (selectedFeeForModal && selectedFeeForModal.id === fee.id) {
        setSelectedFeeForModal(null);
      }
    } else {
      Swal.fire("Грешка", "Проблем при отмяната на плащането.", "error");
    }
  };

  const payGroupCurrent = async (e, group) => {
    e.stopPropagation();

    const rowsToPay = group.rows.filter((f) => {
      const currentDue = Number(f.current_month_due || 0);
      const totalDue = Number(f.total_due || 0);
      const paid = Number(f.paid || 0);
      const amountNeeded = Math.max(0, Math.min(currentDue, totalDue) - paid);
      return amountNeeded > 0;
    });

    if (rowsToPay.length === 0) {
      return Swal.fire(
        "Информация",
        "Няма текущи задължения за този клиент.",
        "info",
      );
    }

    const totalToPay = rowsToPay.reduce((acc, f) => {
      const currentDue = Number(f.current_month_due || 0);
      const totalDue = Number(f.total_due || 0);
      const paid = Number(f.paid || 0);
      return acc + Math.max(0, Math.min(currentDue, totalDue) - paid);
    }, 0);

    const result = await Swal.fire({
      title: "Групово плащане (Текущи)",
      text: `Потвърждавате ли плащане на обща сума от ${formatDualCurrency(totalToPay, selectedYear)} за всички текущи обекти на клиента?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3b82f6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Да, плати",
      cancelButtonText: "Отказ",
    });

    if (!result.isConfirmed) return;

    const updates = rowsToPay.map((f) => {
      const currentDue = Number(f.current_month_due || 0);
      const totalDue = Number(f.total_due || 0);
      const paid = Number(f.paid || 0);
      const amountNeeded = Math.max(0, Math.min(currentDue, totalDue) - paid);
      const targetPaid = paid + amountNeeded;

      return supabase.from("fees").update({ paid: targetPaid }).eq("id", f.id);
    });

    try {
      await Promise.all(updates);

      const updatedIds = rowsToPay.map((r) => r.id);
      setFees((prevFees) =>
        prevFees.map((f) => {
          if (updatedIds.includes(f.id)) {
            const currentDue = Number(f.current_month_due || 0);
            const totalDue = Number(f.total_due || 0);
            const paid = Number(f.paid || 0);
            const amountNeeded = Math.max(
              0,
              Math.min(currentDue, totalDue) - paid,
            );
            return { ...f, paid: paid + amountNeeded };
          }
          return f;
        }),
      );

      Swal.fire({
        title: "Успешно!",
        text: `Успешно са платени ${formatDualCurrency(totalToPay, selectedYear)}.`,
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error(err);
      Swal.fire("Грешка", "Проблем при отразяване на плащането.", "error");
    }
  };

  const payGroupAll = async (e, group) => {
    e.stopPropagation();

    const rowsToPay = group.rows.filter(
      (f) => Number(f.total_due || 0) > Number(f.paid || 0),
    );

    if (rowsToPay.length === 0) {
      return Swal.fire("Информация", "Няма задължения за погасяване.", "info");
    }

    const groupTotal = rowsToPay.reduce(
      (acc, f) => acc + (Number(f.total_due || 0) - Number(f.paid || 0)),
      0,
    );

    const result = await Swal.fire({
      title: "Групово пълно погасяване",
      text: `Потвърждавате ли плащане на ЦЯЛАТА сума от ${formatDualCurrency(groupTotal, selectedYear)} за всички обекти и стари месеци на клиента?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#d33",
      confirmButtonText: "Да, изчисти всичко",
      cancelButtonText: "Отказ",
    });

    if (!result.isConfirmed) return;

    const updates = rowsToPay.map((f) => {
      const newPaid =
        Number(f.paid || 0) + (Number(f.total_due || 0) - Number(f.paid || 0));
      return supabase.from("fees").update({ paid: newPaid }).eq("id", f.id);
    });

    try {
      await Promise.all(updates);

      const updatedIds = rowsToPay.map((r) => r.id);
      setFees((prevFees) =>
        prevFees.map((f) => {
          if (updatedIds.includes(f.id)) {
            const needed = Number(f.total_due || 0) - Number(f.paid || 0);
            return { ...f, paid: Number(f.paid || 0) + needed };
          }
          return f;
        }),
      );

      Swal.fire({
        title: "Успешно!",
        text: `Успешно са погасени задължения на стойност ${formatDualCurrency(groupTotal, selectedYear)}.`,
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error(error);
      Swal.fire("Грешка", "Проблем при отразяване на плащането.", "error");
    }
  };

  const currentFees = useMemo(
    () =>
      fees.filter((f) => f.month === selectedMonth && f.year === selectedYear),
    [fees, selectedMonth, selectedYear],
  );

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
        const hasCompany = !!(
          user &&
          user.company_name &&
          user.company_name.trim() !== ""
        );
        map.set(key, { clientId: key, name, hasCompany, rows: [] });
      }
      map.get(key).rows.push(fee);
    });
    return Array.from(map.values());
  }, [sortedFees]);

  const clientAdvances = useMemo(() => {
    const clientTotals = {};
    const advances = {};

    fees.forEach((f) => {
      const cid = f.client_id;
      if (!cid) return;

      if (!clientTotals[cid]) {
        clientTotals[cid] = { billed: 0, paid: 0 };
      }
      clientTotals[cid].billed += Number(f.current_month_due || 0);
      clientTotals[cid].paid += Number(f.paid || 0);
    });

    Object.keys(clientTotals).forEach((cid) => {
      const diff = clientTotals[cid].paid - clientTotals[cid].billed;
      advances[cid] = diff > 0.01 ? diff : 0;
    });

    return advances;
  }, [fees]);

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
      const currentDue = Number(f.current_month_due || 0);
      const paid = Number(f.paid || 0);

      toCollect += currentDue;
      collected += Math.min(paid, currentDue);
    });
    const progress = toCollect > 0 ? (collected / toCollect) * 100 : 0;

    let toCollectEur, toCollectBgn, collectedEur, collectedBgn;
    if (Number(selectedYear) < 2026) {
      toCollectBgn = toCollect;
      toCollectEur = toCollect / EXCHANGE_RATE;
      collectedBgn = collected;
      collectedEur = collected / EXCHANGE_RATE;
    } else {
      toCollectEur = toCollect;
      toCollectBgn = toCollect * EXCHANGE_RATE;
      collectedEur = collected;
      collectedBgn = collected * EXCHANGE_RATE;
    }

    return { toCollectEur, toCollectBgn, collectedEur, collectedBgn, progress };
  }, [currentFees, selectedYear]);

  const getFeeStatus = (fee) => {
    const paid = Number(fee.paid || 0);
    const totalDue = Number(fee.total_due || 0);

    const rowRem = Math.max(totalDue - paid, 0);

    const isPaidCurrent = totalDue === 0 || paid >= totalDue - 0.01;

    const isFullyPaid = rowRem < 0.01;

    let status = "pending";
    if (isFullyPaid) status = "clean";
    else if (rowRem > 0.01) status = "debt";

    return {
      status,
      totalRem: rowRem,
      rowRem,
      isPaidCurrent,
      isFullyPaid,
      totalDue,
    };
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
    const { status, rowRem, isPaidCurrent, isFullyPaid, totalDue } =
      getFeeStatus(fee);

    const currentDue = Number(fee.current_month_due || 0);

    const hasOldDebts = totalDue > currentDue + 0.01;

    let debtClass = isFullyPaid
      ? "val-green"
      : status === "debt"
        ? "val-red"
        : "val-orange";

    return (
      <tr
        key={fee.id}
        className="af-row"
        onClick={() => setSelectedFeeForModal(fee)}
        style={{ cursor: "pointer" }}
      >
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
          {formatDualCurrency(currentDue, selectedYear)}
        </td>
        <td
          data-label="Дължи (Крайна)"
          className={`text-right num-font ${debtClass} fw-bold`}
        >
          {formatDualCurrency(totalDue, selectedYear)}
        </td>
        <td data-label="Статус" className="text-center">
          <span className={`af-badge ${isPaidCurrent ? "paid" : "unpaid"}`}>
            {totalDue === 0
              ? "Погасено"
              : isPaidCurrent
                ? "Платено"
                : "Неплатено"}
          </span>
        </td>
        <td data-label="Действия" className="af-actions-cell">
          {!isPaidCurrent && totalDue > 0 && (
            <button
              className="af-btn-small sec"
              onClick={(e) => {
                e.stopPropagation();
                payCurrent(fee);
              }}
            >
              Текущо
            </button>
          )}

          {!isFullyPaid && hasOldDebts && (
            <button
              className="af-btn-small prim"
              onClick={(e) => {
                e.stopPropagation();
                payAll(fee);
              }}
            >
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
              menuPortalTarget={document.body}
              styles={selectStyles}
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
                menuPortalTarget={document.body}
                styles={selectStyles}
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
                menuPortalTarget={document.body}
                styles={selectStyles}
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
            <div className="value" style={{ fontSize: "1.2rem" }}>
              <AnimatedCounter value={stats.toCollectEur} /> <small>€ /</small>{" "}
              <AnimatedCounter value={stats.toCollectBgn} /> <small>лв.</small>
            </div>
          </div>
        </div>
        <div className="af-stat-card green">
          <div className="af-stat-icon icon-green">
            <Wallet size={24} strokeWidth={2.5} />
          </div>
          <div className="af-stat-info">
            <div className="label">Събрани</div>
            <div className="value" style={{ fontSize: "1.2rem" }}>
              <AnimatedCounter value={stats.collectedEur} /> <small>€ /</small>{" "}
              <AnimatedCounter value={stats.collectedBgn} /> <small>лв.</small>
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

      <div className="af-view-controls">
        <div className="mobile-view">
          <div className="af-view-toggle-group">
            <button
              className={`af-vt-btn af-flex-align ${
                mobileViewMode === "elevator" ? "active" : ""
              }`}
              onClick={() => {
                setMobileViewMode("elevator");
                setCurrentPage(1);
              }}
              type="button"
            >
              <LayoutDashboard size={16} strokeWidth={2.5} /> Панел
            </button>
            <button
              className={`af-vt-btn af-flex-align ${
                mobileViewMode === "list" ? "active" : ""
              }`}
              onClick={() => {
                setMobileViewMode("list");
                setCurrentPage(1);
              }}
              type="button"
            >
              <List size={16} strokeWidth={2.5} /> Списък
            </button>
          </div>
        </div>

        <div className="desktop-view">
          <div className="af-view-toggle-group">
            <button
              className={`af-vt-btn af-flex-align ${groupByClient ? "active" : ""}`}
              onClick={() => {
                setGroupByClient(true);
                setCurrentPage(1);
              }}
              type="button"
            >
              <Users size={16} strokeWidth={2.5} /> Групи
            </button>
            <button
              className={`af-vt-btn af-flex-align ${!groupByClient ? "active" : ""}`}
              onClick={() => {
                setGroupByClient(false);
                setCurrentPage(1);
              }}
              type="button"
            >
              <List size={16} strokeWidth={2.5} /> Всички
            </button>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            className="af-vt-btn af-flex-align"
            style={{
              backgroundColor: "rgba(16, 185, 129, 0.1)",
              color: "#10b981",
              border: "1px solid #10b981",
            }}
            onClick={() => setIsFeeExportModalOpen(true)}
            title="Експорт в Excel"
            type="button"
          >
            <Download size={16} strokeWidth={2.5} />
            <span className="desktop-only">Експорт</span>
          </button>

          <div className="af-view-info mobile-view">
            {mobileViewMode === "elevator"
              ? `${fees.length} обекта`
              : `${userGroups.length} клиента`}
          </div>
          <div className="af-view-info desktop-view">
            {groupByClient
              ? `${userGroups.length} групирани клиента`
              : `${paginatedData.length} записа на страница`}
          </div>
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
                    <td colSpan="8">
                      <div className="af-empty-state">
                        <CheckCircle2 size={48} strokeWidth={1} />
                        <h3>Всичко е изчистено!</h3>
                        <p>Няма намерени такси за този период.</p>
                      </div>
                    </td>
                  </tr>
                ) : groupByClient ? (
                  paginatedData.map((group) => {
                    const groupTotal = group.rows.reduce(
                      (sum, r) => sum + getFeeStatus(r).rowRem,
                      0,
                    );
                    const groupCurrentDue = group.rows.reduce(
                      (sum, r) => sum + Number(r.current_month_due || 0),
                      0,
                    );
                    const groupCurrentPaid = group.rows.reduce(
                      (sum, r) => sum + Number(r.paid || 0),
                      0,
                    );
                    const groupTotalDue = group.rows.reduce(
                      (sum, r) => sum + Number(r.total_due || 0),
                      0,
                    );
                    const isFullyPaidForMonth =
                      groupTotalDue === 0 ||
                      (groupTotalDue > 0 &&
                        groupCurrentPaid >= groupTotalDue - 0.01);

                    const availableAdvance =
                      clientAdvances[group.clientId] || 0;

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
                              <div className="group-right-actions">
                                {availableAdvance > 0 && (
                                  <span
                                    className="group-total-text fw-bold"
                                    style={{
                                      color: "#9333ea",
                                      backgroundColor:
                                        "rgba(147, 51, 234, 0.1)",
                                      padding: "4px 8px",
                                      borderRadius: "6px",
                                    }}
                                  >
                                    Свободен аванс:{" "}
                                    {formatDualCurrency(
                                      availableAdvance,
                                      selectedYear,
                                    )}
                                  </span>
                                )}

                                {groupTotal > 0 ? (
                                  <span className="group-total-text">
                                    Дължи:{" "}
                                    {formatDualCurrency(
                                      groupTotal,
                                      selectedYear,
                                    )}
                                  </span>
                                ) : groupTotalDue > 0 ? (
                                  <span
                                    className="group-total-text"
                                    style={{ color: "var(--green-text)" }}
                                  >
                                    Платено:{" "}
                                    {formatDualCurrency(
                                      groupTotalDue,
                                      selectedYear,
                                    )}
                                  </span>
                                ) : (
                                  <span
                                    className="group-total-text"
                                    style={{ color: "var(--green-text)" }}
                                  >
                                    Погасено от аванс
                                  </span>
                                )}

                                {groupTotalDue > groupCurrentPaid + 0.01 &&
                                  group.clientId !== "no-client" && (
                                    <button
                                      className="af-btn-small sec"
                                      onClick={(e) => payGroupCurrent(e, group)}
                                    >
                                      Текущи
                                    </button>
                                  )}

                                {groupTotal > 0 &&
                                  group.clientId !== "no-client" && (
                                    <button
                                      className="af-btn-small prim"
                                      onClick={(e) => payGroupAll(e, group)}
                                    >
                                      Всичко
                                    </button>
                                  )}

                                {group.clientId !== "no-client" &&
                                  isFullyPaidForMonth && (
                                    <button
                                      className="af-btn-small sec invoice-btn"
                                      onClick={(e) =>
                                        handleGenerateInvoice(e, group)
                                      }
                                      title={
                                        group.hasCompany
                                          ? "Генерирай фактура"
                                          : "Генерирай проформа"
                                      }
                                    >
                                      <FileText size={14} strokeWidth={2.5} />{" "}
                                      {group.hasCompany
                                        ? "Фактура"
                                        : "Проформа"}
                                    </button>
                                  )}
                              </div>
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
                        type="button"
                        onClick={() => setSelectedFeeForModal(fee)}
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
                (sum, r) => sum + getFeeStatus(r).rowRem,
                0,
              );
              const groupCurrentDue = group.rows.reduce(
                (sum, r) => sum + Number(r.current_month_due || 0),
                0,
              );
              const groupCurrentPaid = group.rows.reduce(
                (sum, r) => sum + Number(r.paid || 0),
                0,
              );
              const groupTotalDue = group.rows.reduce(
                (sum, r) => sum + Number(r.total_due || 0),
                0,
              );
              const isFullyPaidForMonth =
                groupTotalDue === 0 ||
                (groupTotalDue > 0 && groupCurrentPaid >= groupTotalDue - 0.01);

              const availableAdvance = clientAdvances[group.clientId] || 0;
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

                    {availableAdvance > 0 && (
                      <div style={{ marginTop: "4px", marginBottom: "8px" }}>
                        <span
                          className="af-m-debt fw-bold"
                          style={{
                            color: "#9333ea",
                            backgroundColor: "rgba(147, 51, 234, 0.1)",
                            padding: "2px 6px",
                            borderRadius: "4px",
                          }}
                        >
                          Свободен аванс:{" "}
                          {formatDualCurrency(availableAdvance, selectedYear)}
                        </span>
                      </div>
                    )}

                    <div
                      className="af-m-meta"
                      style={{
                        display: "flex",
                        gap: "8px",
                        alignItems: "center",
                        flexWrap: "wrap",
                        justifyContent: "flex-end",
                      }}
                    >
                      {groupTotal > 0 ? (
                        <span className="af-m-debt">
                          Дължи: {formatDualCurrency(groupTotal, selectedYear)}
                        </span>
                      ) : groupTotalDue > 0 ? (
                        <span
                          className="af-m-debt"
                          style={{ color: "var(--green-text)" }}
                        >
                          Платено:{" "}
                          {formatDualCurrency(groupTotalDue, selectedYear)}
                        </span>
                      ) : (
                        <span
                          className="af-m-debt"
                          style={{ color: "var(--green-text)" }}
                        >
                          Погасено от аванс
                        </span>
                      )}

                      {groupTotalDue > groupCurrentPaid + 0.01 &&
                        group.clientId !== "no-client" && (
                          <button
                            className="af-btn-small sec"
                            onClick={(e) => payGroupCurrent(e, group)}
                            style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                          >
                            Текущи
                          </button>
                        )}

                      {groupTotal > 0 && group.clientId !== "no-client" && (
                        <button
                          className="af-btn-small prim"
                          onClick={(e) => payGroupAll(e, group)}
                          style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                        >
                          Всичко
                        </button>
                      )}

                      {group.clientId !== "no-client" &&
                        isFullyPaidForMonth && (
                          <button
                            className="af-btn-small sec invoice-btn"
                            onClick={(e) => handleGenerateInvoice(e, group)}
                            title={
                              group.hasCompany
                                ? "Генерирай фактура"
                                : "Генерирай проформа"
                            }
                          >
                            <FileText size={14} strokeWidth={2.5} />
                          </button>
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
                        const { status, totalRem, isFullyPaid } =
                          getFeeStatus(fee);
                        const currentDue = Number(fee.current_month_due || 0);

                        let debtClass = isFullyPaid
                          ? "val-green"
                          : status === "debt"
                            ? "val-red"
                            : "val-orange";

                        return (
                          <div
                            key={fee.id}
                            className="af-m-row"
                            onClick={() => setSelectedFeeForModal(fee)}
                          >
                            <div className="af-m-row-main">
                              <span className={`dot ${status}`}></span>
                              <span className="obj-name">
                                {fee.type} {fee.object_number}
                              </span>
                            </div>

                            <div
                              className="af-m-row-right"
                              style={{
                                flexDirection: "column",
                                alignItems: "flex-end",
                                gap: "4px",
                              }}
                            >
                              <span
                                className="af-m-row-val"
                                style={{
                                  fontSize: "0.8rem",
                                  color: "var(--af-text-sec)",
                                }}
                              >
                                Текуща:{" "}
                                {formatDualCurrency(currentDue, selectedYear)}
                              </span>
                              <span
                                className={`af-m-row-val ${debtClass} fw-bold`}
                                style={{ fontSize: "0.95rem" }}
                              >
                                Общо:{" "}
                                {formatDualCurrency(totalRem, selectedYear)}
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

      <FeeDetails
        isOpen={!!selectedFeeForModal}
        onClose={() => setSelectedFeeForModal(null)}
        feeId={selectedFeeForModal?.id}
        onEditFeeClick={(feeData) => setSelectedFeeForEdit(feeData)}
        onPayCurrent={() => {
          if (selectedFeeForModal) payCurrent(selectedFeeForModal);
        }}
        onPayAll={() => {
          if (selectedFeeForModal) payAll(selectedFeeForModal);
        }}
        onRevertPayment={() => {
          if (selectedFeeForModal) revertPayment(selectedFeeForModal);
        }}
      />

      <EditFee
        isOpen={!!selectedFeeForEdit}
        onClose={() => setSelectedFeeForEdit(null)}
        fee={selectedFeeForEdit}
        onSuccess={() => {
          fetchFees(selectedBuilding.value, selectedMonth, selectedYear);
        }}
      />

      <FeeExportModal
        isOpen={isFeeExportModalOpen}
        onClose={() => setIsFeeExportModalOpen(false)}
        selectedBuilding={selectedBuilding}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
      />
    </div>
  );
}

export default AdminFees;
