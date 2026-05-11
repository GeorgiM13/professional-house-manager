import { useState, useEffect, useMemo, Fragment } from "react";
import Select from "react-select";
import { supabase } from "../supabaseClient";
import { generateFees } from "../algorithms/fees";
import Swal from "sweetalert2";
import { useUserBuildings } from "./hooks/UseUserBuildings";
import { useLocalUser } from "./hooks/UseLocalUser";
import { useTheme } from "../components/ThemeContext";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { registerCalibri } from "../../fonts/calibri.js";

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
} from "lucide-react";
import "./styles/AdminFees.css";

const EXCHANGE_RATE = 1.95583;

const LOGO_BASE64 =
  "data:image/png;base64,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";

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
        users ( id, first_name, second_name, last_name, company_name, company_eik, company_mol, company_address )
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

    const client = group.rows[0]?.users;
    if (!client || !client.company_name) return;

    const buildingInfo = selectedBuilding
      ? selectedBuilding.label
      : "Не е избрана сграда";
    const monthLabel =
      monthOptions.find((m) => m.value === selectedMonth)?.label ||
      selectedMonth;

    let invoiceTotal = 0;
    const invoiceRows = [];
    let rowIndex = 1;

    group.rows.forEach((fee) => {
      const paidAmount = Number(fee.paid || 0);
      if (paidAmount > 0.01) {
        invoiceTotal += paidAmount;

        const objName = formatObjectName(fee.type, fee.object_number);
        const description = `Такса управление и поддръжка - ${objName} (м. ${monthLabel} ${selectedYear} г.)`;

        invoiceRows.push([
          rowIndex++,
          description,
          "бр.",
          "1",
          formatDualCurrency(paidAmount, selectedYear),
          formatDualCurrency(paidAmount, selectedYear),
        ]);
      }
    });

    if (invoiceTotal <= 0) {
      Swal.fire("Информация", "Няма платени суми за този период.", "info");
      return;
    }

    Swal.fire({
      title: "Обработка на фактура...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const { data: existingInvoice, error: checkError } = await supabase
        .from("invoices")
        .select("invoice_number, created_at, line_items")
        .eq("client_id", client.id)
        .eq("month", selectedMonth)
        .eq("year", selectedYear)
        .maybeSingle();

      if (checkError) throw checkError;

      let invoiceNumber;
      let invoiceDate;
      let finalInvoiceRows = invoiceRows;

      if (existingInvoice) {
        invoiceNumber = existingInvoice.invoice_number;
        invoiceDate = new Date(existingInvoice.created_at).toLocaleDateString(
          "bg-BG",
        );
        if (existingInvoice.line_items) {
          finalInvoiceRows = existingInvoice.line_items;
        }
      } else {
        const { data: newNumber, error: seqError } = await supabase.rpc(
          "get_next_invoice_number",
        );
        if (seqError) throw seqError;

        invoiceNumber = newNumber;
        invoiceDate = new Date().toLocaleDateString("bg-BG");

        const { error: insertError } = await supabase.from("invoices").insert({
          invoice_number: invoiceNumber,
          client_id: client.id,
          month: selectedMonth,
          year: selectedYear,
          total_amount: invoiceTotal,
          line_items: finalInvoiceRows,
        });

        if (insertError) throw insertError;
      }

      const doc = new jsPDF();
      registerCalibri(doc);

      doc.setFont("Calibri", "bold");
      doc.setFontSize(26);
      doc.setTextColor(235, 235, 235);

      doc.setTextColor(0, 0, 0);

      if (LOGO_BASE64 && LOGO_BASE64 !== "Сложи Тук") {
        try {
          const getImageProps = (base64) => {
            return new Promise((resolve, reject) => {
              const img = new Image();
              img.src = base64;
              img.onload = () =>
                resolve({ width: img.width, height: img.height });
              img.onerror = (err) => reject(err);
            });
          };
          const props = await getImageProps(LOGO_BASE64);
          const maxLogoWidth = 45;
          const ratio = props.height / props.width;
          const logoHeight = maxLogoWidth * ratio;
          doc.addImage(LOGO_BASE64, "PNG", 14, 12, maxLogoWidth, logoHeight);
        } catch (imgError) {
          console.error("Грешка при логото:", imgError);
        }
      }

      doc.setFontSize(22);
      doc.setFont("Calibri", "bold");
      doc.text("ФАКТУРА", 105, 22, { align: "center" });
      doc.setFontSize(10);
      doc.setFont("Calibri", "normal");
      doc.text("(Оригинал)", 105, 27, {
        align: "center",
      });

      doc.setFontSize(11);
      doc.setFont("Calibri", "bold");
      doc.text(`№: ${invoiceNumber}`, 105, 36, { align: "center" });
      doc.text(`от: ${invoiceDate}`, 105, 41, { align: "center" });

      doc.setLineWidth(0.3);
      doc.setDrawColor(0, 0, 0);

      doc.rect(14, 48, 88, 35);
      doc.setFontSize(10);
      doc.setFont("Calibri", "bold");
      doc.text("ДОСТАВЧИК:", 16, 53);
      doc.setFont("Calibri", "normal");
      doc.text("Име: Профи Дом-Русе ЕООД", 16, 59);
      doc.text("ЕИК: 206808574", 16, 64);
      doc.text("МОЛ: Калоян Георгиев Миланов", 16, 69);
      doc.text("Адрес: гр. Русе", 16, 74, { maxWidth: 84 });

      doc.rect(108, 48, 88, 35);
      doc.setFont("Calibri", "bold");
      doc.text("ПОЛУЧАТЕЛ:", 110, 53);
      doc.setFont("Calibri", "normal");
      doc.text(`Име: ${client.company_name}`, 110, 59, { maxWidth: 84 });
      doc.text(`ЕИК: ${client.company_eik || "Не е посочен"}`, 110, 64);
      doc.text(`МОЛ: ${client.company_mol || "Не е посочен"}`, 110, 69);
      doc.text(`Адрес: ${client.company_address || "Не е посочен"}`, 110, 74, {
        maxWidth: 84,
      });

      doc.setFont("Calibri", "bold");
      doc.text("Относно обект:", 14, 91);
      doc.setFont("Calibri", "normal");
      doc.text(buildingInfo, 43, 91);
      doc.text(`Отчетен период: ${monthLabel} ${selectedYear} г.`, 14, 96);

      autoTable(doc, {
        startY: 100,
        head: [
          [
            "№",
            "Наименование на стоките и услугите",
            "Мярка",
            "Кол.",
            "Ед. цена",
            "Стойност",
          ],
        ],
        body: finalInvoiceRows,
        theme: "grid",
        styles: {
          font: "Calibri",
          fontSize: 9,
          lineColor: [0, 0, 0],
          lineWidth: 0.2,
        },
        headStyles: {
          fillColor: [230, 230, 230],
          textColor: [0, 0, 0],
          fontStyle: "bold",
          halign: "center",
        },
        columnStyles: {
          0: { halign: "center", cellWidth: 10 },
          2: { halign: "center", cellWidth: 15 },
          3: { halign: "center", cellWidth: 12 },
          4: { halign: "right" },
          5: { halign: "right" },
        },
      });

      const finalY = doc.lastAutoTable?.finalY || 100;
      const baseAmount = invoiceTotal / 1.2;
      const vatAmount = invoiceTotal - baseAmount;

      doc.rect(126, finalY + 5, 70, 26);
      doc.setFontSize(10);
      doc.text(`Данъчна основа:`, 128, finalY + 11);
      doc.text(
        `${formatDualCurrency(baseAmount, selectedYear)}`,
        194,
        finalY + 11,
        { align: "right" },
      );
      doc.text(`ДДС (20%):`, 128, finalY + 18);
      doc.text(
        `${formatDualCurrency(vatAmount, selectedYear)}`,
        194,
        finalY + 18,
        { align: "right" },
      );
      doc.line(126, finalY + 22, 196, finalY + 22);
      doc.setFontSize(11);
      doc.setFont("Calibri", "bold");
      doc.text(`Всичко за плащане:`, 128, finalY + 28);
      doc.text(
        `${formatDualCurrency(invoiceTotal, selectedYear)}`,
        194,
        finalY + 28,
        { align: "right" },
      );

      const signY = finalY + 45;
      doc.setFont("Calibri", "normal");
      doc.setFontSize(10);
      doc.line(14, signY, 70, signY);
      doc.text("Получател", 32, signY + 5);
      doc.setFontSize(8);
      doc.text("(подпис)", 35, signY + 9);
      doc.setFontSize(10);
      doc.line(126, signY, 196, signY);
      doc.text("Съставил: Калоян Миланов", 126, signY - 2);
      doc.setFontSize(8);
      doc.text("(подпис и печат)", 150, signY + 5);
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(
        "Генерирано автоматично чрез системата на Профи Дом - Русе.",
        105,
        pageHeight - 10,
        { align: "center" },
      );

      try {
        doc.setGState(new doc.GState({ opacity: 0.12 }));
        doc.setFont("Calibri", "bold");
        doc.setFontSize(20);
        doc.setTextColor(150, 150, 150);
        const watermarkLine = Array(45).fill("ОРИГИНАЛ").join("    ");
        for (let y = -200; y < 800; y += 20) {
          doc.text(watermarkLine, -50, y, { angle: 45 });
        }
        doc.setGState(new doc.GState({ opacity: 1.0 }));
      } catch (e) {
        console.error("Watermark error", e);
      }

      Swal.close();

      const fileNameSuffix = "";
      doc.save(
        `Фактура_${client.company_name.replace(/\s+/g, "_")}_${monthLabel}_${selectedYear}${fileNameSuffix}.pdf`,
      );
    } catch (error) {
      Swal.close();
      console.error(error);
      Swal.fire("Грешка", "Проблем при генериране на PDF.", "error");
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
      text: `Потвърждавате ли плащане на сума от ${formatDualCurrency(amountToPay, selectedYear)} за ${objectName}?`,
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
      text: `Потвърждавате ли плащане на ЦЯЛАТА сума от ${formatDualCurrency(totalRem, selectedYear)} за ${objectName}?`,
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
          {formatDualCurrency(currentDue, selectedYear)}
        </td>
        <td
          data-label="Дължи"
          className={`text-right num-font ${debtClass} fw-bold`}
        >
          {formatDualCurrency(totalRem, selectedYear)}
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
                              <div className="group-right-actions">
                                {groupTotal > 0 && (
                                  <span className="group-total-text">
                                    Дължи:{" "}
                                    {formatDualCurrency(
                                      groupTotal,
                                      selectedYear,
                                    )}
                                  </span>
                                )}
                                {group.hasCompany && (
                                  <button
                                    className="af-btn-small sec invoice-btn"
                                    onClick={(e) =>
                                      handleGenerateInvoice(e, group)
                                    }
                                    title="Генерирай фактура"
                                  >
                                    <FileText size={14} strokeWidth={2.5} />{" "}
                                    Фактура
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
                          {formatDualCurrency(groupTotal, selectedYear)}
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
                                {formatDualCurrency(totalRem, selectedYear)}
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
                        {formatDualCurrency(totalRem, selectedYear)}
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
                              Плати текущо (
                              {formatDualCurrency(rowRem, selectedYear)})
                            </button>
                          )}
                          <button
                            className="modal-btn prim"
                            onClick={() => payAll(selectedFeeForModal)}
                            type="button"
                          >
                            ПЛАТИ ВСИЧКО (
                            {formatDualCurrency(totalRem, selectedYear)})
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
