import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const EXPENSE_FIELDS = [
  { key: "cash_feed", label: "Захранване на каса" },
  { key: "management_fee", label: "Домоуправител" },
  { key: "cleaner", label: "Хигиенист" },
  { key: "cleaning_materials", label: "Конс. почистване" },
  { key: "repair_fund", label: "Фонд Ремонт" },
  { key: "repairs", label: "Ремонт" },
  { key: "fee_lift", label: "Сервиз асансьор" },
  { key: "elevator_inspection", label: "Преглед асансьор" },
  { key: "electricity_lift", label: "Ток асансьор (общо)" },
  { key: "electricity_elevator_apartments", label: "Ток асансьор (ап.)" },
  { key: "electricity_elevator_offices", label: "Ток асансьор (оф.)" },
  { key: "electricity_light", label: "Ток осветление (общо)" },
  { key: "electricity_staircase_apartments", label: "Ток стълбище (ап.)" },
  { key: "electricity_staircase_offices", label: "Ток стълбище (оф.)" },
  { key: "electricity_garages", label: "Ток гаражи" },
  { key: "electricity_ventilation", label: "Ток вентилация" },
  { key: "lighting_supplies", label: "Осветление (конс.)" },
  { key: "water_common", label: "Вода обща" },
  { key: "disinsection", label: "Дезинсекция" },
  { key: "internet", label: "Интернет" },
  { key: "video_surveillance", label: "Видеонаблюдение" },
  { key: "access_control", label: "Контрол достъп" },
  { key: "rounding_remainder", label: "Закръгляне" },
];

const REAL_EXPENSE_TYPES = [
  { value: "electricity_lift", label: "Ток асансьор" },
  { value: "fee_lift", label: "Сервиз асансьор" },
  { value: "electricity_light", label: "Ток осветление" },
  { value: "cleaner", label: "Хигиенист" },
  { value: "repair", label: "Ремонт" },
  { value: "manager", label: "Домоуправител" },
  { value: "water_building", label: "Вода обща" },
  { value: "lighting", label: "Осветление (консумативи)" },
  { value: "cleaning_supplies", label: "Материали почистване" },
  { value: "fee_annual_review", label: "Годишен преглед асансьор" },
  { value: "internet_video", label: "Интернет / Видео" },
  { value: "access_control", label: "Контрол достъп" },
  { value: "pest_control", label: "Дезинсекция" },
  { value: "other", label: "Други" },
  { value: "electricity_ventilation", label: "Ток вентилация" },
];

const getColLetter = (colIdx) => {
  let letter = "";
  while (colIdx > 0) {
    let temp = (colIdx - 1) % 26;
    letter = String.fromCharCode(65 + temp) + letter;
    colIdx = Math.floor((colIdx - temp) / 26);
  }
  return letter;
};

const sortByTypeAndNumber = (a, b) => {
  if (a.type !== b.type) {
    return a.type.localeCompare(b.type, "bg");
  }
  const numA = parseFloat(String(a.number).replace(/[^\d.-]/g, "")) || 0;
  const numB = parseFloat(String(b.number).replace(/[^\d.-]/g, "")) || 0;

  if (numA !== numB) return numA - numB;
  return String(a.number).localeCompare(String(b.number), "bg", {
    numeric: true,
  });
};

export const generateFeeExcelReport = async ({
  supabase,
  buildingId,
  exportType,
  currentMonth,
  currentYear,
  startMonth,
  startYear,
  endMonth,
  endYear,
}) => {
  try {
    const { data: buildingData } = await supabase
      .from("buildings")
      .select("name")
      .eq("id", buildingId)
      .single();

    const safeBuildingName = buildingData?.name
      ? buildingData.name.replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, "_")
      : "Sgrada";

    let feesQuery = supabase
      .from("fees")
      .select(`*, users ( id, first_name, last_name, company_name )`)
      .eq("building_id", buildingId);

    let expensesQuery = supabase
      .from("expenses")
      .select("*")
      .eq("building_id", buildingId);

    if (exportType === "current") {
      feesQuery = feesQuery.eq("month", currentMonth).eq("year", currentYear);
      expensesQuery = expensesQuery
        .eq("month", currentMonth)
        .eq("year", currentYear);
    } else if (exportType === "period") {
      feesQuery = feesQuery.gte("year", startYear).lte("year", endYear);
      expensesQuery = expensesQuery.gte("year", startYear).lte("year", endYear);
    }

    const [feesRes, expRes] = await Promise.all([feesQuery, expensesQuery]);

    if (feesRes.error) throw feesRes.error;
    if (expRes.error) throw expRes.error;

    let dataToProcess = feesRes.data || [];
    let expensesData = expRes.data || [];

    if (exportType === "period") {
      const startValue = parseInt(startYear) * 12 + parseInt(startMonth);
      const endValue = parseInt(endYear) * 12 + parseInt(endMonth);

      dataToProcess = dataToProcess.filter((row) => {
        const rowValue = parseInt(row.year) * 12 + parseInt(row.month);
        return rowValue >= startValue && rowValue <= endValue;
      });

      expensesData = expensesData.filter((row) => {
        const rowValue = parseInt(row.year) * 12 + parseInt(row.month);
        return rowValue >= startValue && rowValue <= endValue;
      });
    }

    if (dataToProcess.length === 0) {
      throw new Error("Няма намерени данни за избрания период.");
    }

    dataToProcess.sort((a, b) => a.year - b.year || a.month - b.month);

    const periods = [];
    const periodSet = new Set();
    dataToProcess.forEach((r) => {
      const label = `${r.month.toString().padStart(2, "0")}/${r.year}`;
      if (!periodSet.has(label)) {
        periodSet.add(label);
        periods.push({ month: r.month, year: r.year, label });
      }
    });

    const [aptsRes, offsRes, garsRes, retsRes] = await Promise.all([
      supabase
        .from("apartments")
        .select("number, area")
        .eq("building_id", buildingId),
      supabase
        .from("offices")
        .select("number, area")
        .eq("building_id", buildingId),
      supabase
        .from("garages")
        .select("number, area")
        .eq("building_id", buildingId),
      supabase
        .from("retails")
        .select("number, area")
        .eq("building_id", buildingId),
    ]);

    const getArea = (type, number) => {
      const t = (type || "").toLowerCase();
      let collection = [];
      if (t === "apartments" || t.includes("ап"))
        collection = aptsRes.data || [];
      else if (t === "offices" || t.includes("оф"))
        collection = offsRes.data || [];
      else if (t === "garages" || t.includes("гар") || t.includes("пар"))
        collection = garsRes.data || [];
      else if (t === "retails" || t.includes("ret") || t.includes("рит"))
        collection = retsRes.data || [];

      const found = collection.find((x) => String(x.number) === String(number));
      return found && found.area ? Number(found.area) : 0;
    };

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Профи Дом";

    const sheet1 = workbook.addWorksheet("Обекти и Такси", {
      views: [{ state: "frozen", xSplit: 2, ySplit: 1 }],
    });

    const objectsMap = new Map();
    const ownersMap = new Map();
    const activeFeeExpenseKeys = new Set();

    dataToProcess.forEach((row) => {
      const rounding = Number(row.rounding_remainder || 0);
      if (rounding !== 0) {
        const typeMatch = String(row.type || "")
          .toLowerCase()
          .trim();
        let targetKey = "electricity_light";

        if (
          [
            "garages",
            "parkings",
            "гараж",
            "гаражи",
            "паркинг",
            "паркомясто",
          ].includes(typeMatch)
        ) {
          targetKey = "electricity_garages";
        } else if (
          ["retails", "търговски", "ритейл", "магазин", "retail"].includes(
            typeMatch,
          )
        ) {
          targetKey = "management_fee";
        } else if (["offices", "офис", "офиси"].includes(typeMatch)) {
          targetKey = "electricity_elevator_offices";
        } else if (
          ["apartments", "апартамент", "апартаменти"].includes(typeMatch)
        ) {
          targetKey = "electricity_elevator_apartments";
        }

        row[targetKey] = Number(row[targetKey] || 0) + rounding;
        row.rounding_remainder = 0;
      }

      const objectKey = `${row.type}|${row.object_number}`;
      if (!objectsMap.has(objectKey)) {
        const ownerName = row.users
          ? row.users.company_name ||
            `${row.users.first_name} ${row.users.last_name}`
          : "Без собственик";

        objectsMap.set(objectKey, {
          type: row.type,
          number: row.object_number,
          owner: ownerName,
          floor: row.floor || "-",
          area: getArea(row.type, row.object_number),
          paid: 0,
          expenses: {},
          final_net_balance: 0,
        });
      }

      const obj = objectsMap.get(objectKey);
      obj.paid += Number(row.paid || 0);

      const netBal =
        Number(row.previous_debt || 0) -
        Number(row.advance_payment || 0) +
        Number(row.current_month_due || 0) -
        Number(row.paid || 0);

      obj.final_net_balance = netBal;

      EXPENSE_FIELDS.forEach((field) => {
        const val = Number(row[field.key] || 0);
        if (val !== 0 && field.key !== "rounding_remainder") {
          if (field.key === "cash_feed" && netBal <= 0.01) {
            return;
          }

          activeFeeExpenseKeys.add(field.key);
          if (!obj.expenses[field.key]) obj.expenses[field.key] = [];
          obj.expenses[field.key].push(val);
        }
      });

      const ownerId = row.client_id || "no-client";
      const ownerName2 = row.users
        ? row.users.company_name ||
          `${row.users.first_name} ${row.users.last_name}`
        : "Без собственик";

      if (!ownersMap.has(ownerId)) {
        ownersMap.set(ownerId, {
          name: ownerName2,
          residents: 0,
          area: 0,
          paid: 0,
          monthlyDues: {},
          uniqueObjects: new Set(),
          objectFinalDebts: {},
          objectFinalAdvances: {},
        });
      }

      const clientObj = ownersMap.get(ownerId);
      const periodKey = `${row.month.toString().padStart(2, "0")}/${row.year}`;
      clientObj.monthlyDues[periodKey] =
        (clientObj.monthlyDues[periodKey] || 0) +
        Number(row.current_month_due || 0);
      clientObj.paid += Number(row.paid || 0);

      if (!clientObj.uniqueObjects.has(objectKey)) {
        clientObj.uniqueObjects.add(objectKey);
        clientObj.residents += row.residents || 0;
        clientObj.area += getArea(row.type, row.object_number);
      }

      clientObj.objectFinalDebts[objectKey] = netBal > 0 ? netBal : 0;
      clientObj.objectFinalAdvances[objectKey] =
        netBal < 0 ? Math.abs(netBal) : 0;
    });

    const activeFeeExpenses = EXPENSE_FIELDS.filter(
      (f) => activeFeeExpenseKeys.has(f.key) && f.key !== "rounding_remainder",
    );

    const sheet1Columns = [
      { header: "Тип", key: "type", width: 16 },
      { header: "Обект №", key: "number", width: 10 },
      { header: "Собственик", key: "owner", width: 35 },
      { header: "Ниво", key: "floor", width: 8 },
      { header: "Площ", key: "area", width: 12 },
    ];

    activeFeeExpenses.forEach((exp) => {
      const label =
        exp.key === "cash_feed" ? "Дължими по авансово плащане" : exp.label;
      sheet1Columns.push({ header: label, key: exp.key, width: 22 });
    });

    sheet1Columns.push({
      header: "Оставащо дължимо",
      key: "remaining",
      width: 20,
    });

    sheet1.columns = sheet1Columns;
    sheet1.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: sheet1Columns.length },
    };

    const remColIdx1 = 5 + activeFeeExpenses.length + 1;

    sheet1.getRow(1).font = { bold: true };
    sheet1.getRow(1).alignment = { vertical: "middle", horizontal: "center" };
    sheet1.getRow(1).eachCell((cell, colNum) => {
      if (colNum === 5)
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFCD5B4" },
        };
      else if (colNum === remColIdx1) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFDC2626" },
        };
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      } else if (colNum < remColIdx1)
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE5E7EB" },
        };
    });

    const sortedObjects = Array.from(objectsMap.values()).sort(
      sortByTypeAndNumber,
    );

    sortedObjects.forEach((obj, index) => {
      const rowData = {
        type: obj.type.charAt(0).toUpperCase() + obj.type.slice(1),
        number: obj.number,
        owner: obj.owner,
        floor: obj.floor,
        area: obj.area,
      };

      const finalBalance = obj.final_net_balance;

      activeFeeExpenses.forEach((exp) => {
        const values = obj.expenses[exp.key] || [];
        const sum = values.reduce((a, b) => a + b, 0);

        if (sum === 0) rowData[exp.key] = null;
        else if (values.length === 1) rowData[exp.key] = values[0];
        else
          rowData[exp.key] = {
            formula: values.map((v) => v.toFixed(2)).join("+"),
          };
      });

      rowData.remaining = finalBalance !== 0 ? finalBalance : null;

      const excelRow = sheet1.addRow(rowData);
      const isEven = index % 2 === 0;
      const rowBgColor = isEven ? "FFFFFFFF" : "FFF9FAFB";

      excelRow.eachCell((cell, colNum) => {
        if (colNum === 5) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFFE6D0" },
          };
        } else if (colNum === remColIdx1) {
          if (finalBalance > 0.01) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFFEF2F2" },
            };
            cell.font = { color: { argb: "FFDC2626" }, bold: true };
          } else if (finalBalance < -0.01) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFF0FDF4" },
            };
            cell.font = { color: { argb: "FF16A34A" }, bold: true };
          } else {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: rowBgColor },
            };
          }
        } else if (colNum < remColIdx1) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: rowBgColor },
          };
        }
      });
    });

    const totalRowSheet1 = sheet1.addRow([]);
    const t1Row = totalRowSheet1.number;
    totalRowSheet1.getCell(1).value = "Общо:";
    totalRowSheet1.getCell(1).font = { bold: true };

    totalRowSheet1.getCell(5).value =
      t1Row > 2 ? { formula: `SUBTOTAL(9, E2:E${t1Row - 1})` } : 0;
    totalRowSheet1.getCell(5).font = { bold: true };
    totalRowSheet1.getCell(5).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFD700" },
    };

    for (let i = 6; i <= remColIdx1; i++) {
      const colLetter = getColLetter(i);
      totalRowSheet1.getCell(i).value =
        t1Row > 2
          ? { formula: `SUBTOTAL(9, ${colLetter}2:${colLetter}${t1Row - 1})` }
          : 0;
      totalRowSheet1.getCell(i).font = { bold: true };
      totalRowSheet1.getCell(i).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFD700" },
      };
    }

    const expStartCol = remColIdx1 + 3;

    sheet1.getCell(1, expStartCol).value = "Сума на разпределените такси:";
    sheet1.getCell(1, expStartCol).font = { bold: true, underline: true };
    sheet1.getCell(1, expStartCol).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE5E7EB" },
    };

    periods.forEach((p, pIdx) => {
      const cell = sheet1.getCell(1, expStartCol + 1 + pIdx);
      cell.value = p.label;
      cell.font = { bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE5E7EB" },
      };
    });

    let expRowIndex = 2;
    const summaryStartRowIndex = 2;

    activeFeeExpenses.forEach((exp) => {
      let hasValueForAnyMonth = false;
      const tempVals = [];

      periods.forEach((p) => {
        const sumForMonth = dataToProcess
          .filter((r) => r.month === p.month && r.year === p.year)
          .reduce((acc, r) => acc + Number(r[exp.key] || 0), 0);
        tempVals.push(sumForMonth);
        if (sumForMonth !== 0) hasValueForAnyMonth = true;
      });

      if (hasValueForAnyMonth) {
        sheet1.getCell(expRowIndex, expStartCol).value = exp.label;
        tempVals.forEach((v, i) => {
          const cell = sheet1.getCell(expRowIndex, expStartCol + 1 + i);
          cell.value = v === 0 ? null : v;
        });
        expRowIndex++;
      }
    });

    sheet1.getCell(expRowIndex, expStartCol).value = "Общо:";
    sheet1.getCell(expRowIndex, expStartCol).font = { bold: true };
    sheet1.getCell(expRowIndex, expStartCol).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFD700" },
    };

    periods.forEach((p, i) => {
      const colL = getColLetter(expStartCol + 1 + i);
      const cell = sheet1.getCell(expRowIndex, expStartCol + 1 + i);
      cell.value =
        expRowIndex > summaryStartRowIndex
          ? {
              formula: `SUM(${colL}${summaryStartRowIndex}:${colL}${expRowIndex - 1})`,
            }
          : 0;
      cell.font = { bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFD700" },
      };
    });

    sheet1.getColumn(expStartCol).width = 30;
    periods.forEach((p, i) => {
      sheet1.getColumn(expStartCol + 1 + i).width = 15;
    });

    const sheet2 = workbook.addWorksheet("Такси по Клиенти", {
      views: [{ state: "frozen", xSplit: 3, ySplit: 1 }],
    });

    const t2HeaderRowData = ["ИМЕ", "БР.ОБИТ.", "Площ"];
    periods.forEach((p) => t2HeaderRowData.push(p.label));

    t2HeaderRowData.push(
      "НАЧИСЛЕНИ",
      "ПЛАТЕНИ",
      "ОСТАВ. ДЪЛГ",
      "НАЛИЧЕН АВАНС",
    );

    t2HeaderRowData.forEach((colText, colIdx) => {
      const cell = sheet2.getCell(1, colIdx + 1);
      cell.value = colText;
      cell.font = { bold: true };

      if (colText === "НАЧИСЛЕНИ") {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF008000" },
        };
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      } else if (colText === "ПЛАТЕНИ") {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF0284C7" },
        };
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      } else if (colText === "ОСТАВ. ДЪЛГ") {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFDC2626" },
        };
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      } else if (colText === "НАЛИЧЕН АВАНС") {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF059669" },
        };
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      } else if (colText === "Площ") {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFCD5B4" },
        };
      } else {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE5E7EB" },
        };
      }
    });

    const sortedOwners = Array.from(ownersMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "bg"),
    );
    let currentClientRow = 2;

    sortedOwners.forEach((obj) => {
      sheet2.getCell(currentClientRow, 1).value = obj.name;
      sheet2.getCell(currentClientRow, 2).value = obj.residents;

      const areaCell = sheet2.getCell(currentClientRow, 3);
      areaCell.value = obj.area;
      areaCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFE6D0" },
      };

      periods.forEach((p, pIdx) => {
        const due = obj.monthlyDues[p.label] || 0;
        sheet2.getCell(currentClientRow, 4 + pIdx).value =
          due === 0 ? null : due;
      });

      const dueColIdx2 = 4 + periods.length;
      const paidColIdx2 = dueColIdx2 + 1;
      const remainingColIdx2 = dueColIdx2 + 2;
      const advColIdx2 = dueColIdx2 + 3;

      const startMonthLetter = getColLetter(4);
      const endMonthLetter = getColLetter(3 + periods.length);

      const dueCell = sheet2.getCell(currentClientRow, dueColIdx2);
      if (periods.length > 0) {
        dueCell.value = {
          formula: `SUM(${startMonthLetter}${currentClientRow}:${endMonthLetter}${currentClientRow})`,
        };
      } else {
        dueCell.value = 0;
      }
      dueCell.font = { bold: true };
      dueCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF8FAFC" },
      };

      const paidCell = sheet2.getCell(currentClientRow, paidColIdx2);
      paidCell.value = obj.paid;
      paidCell.font = { bold: true };
      paidCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF0F9FF" },
      };

      const totalClientDebt = Object.values(obj.objectFinalDebts).reduce(
        (a, b) => a + b,
        0,
      );
      const remCell = sheet2.getCell(currentClientRow, remainingColIdx2);
      remCell.value = totalClientDebt > 0 ? totalClientDebt : null;

      if (totalClientDebt > 0.01) {
        remCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFEF2F2" },
        };
        remCell.font = { color: { argb: "FFDC2626" }, bold: true };
      } else {
        remCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF0FDF4" },
        };
        remCell.font = { color: { argb: "FF16A34A" }, bold: true };
      }

      const totalClientAdvance = Object.values(obj.objectFinalAdvances).reduce(
        (a, b) => a + b,
        0,
      );
      const advCell = sheet2.getCell(currentClientRow, advColIdx2);
      advCell.value = totalClientAdvance > 0 ? totalClientAdvance : null;

      if (totalClientAdvance > 0.01) {
        advCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF0FDF4" },
        };
        advCell.font = { color: { argb: "FF059669" }, bold: true };
      } else {
        advCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFFFFF" },
        };
      }

      currentClientRow++;
    });

    const lastClientTableColIdx = 7 + periods.length;
    const totalRowBase = currentClientRow;

    sheet2.getCell(totalRowBase, 1).value = "Общо:";
    sheet2.getCell(totalRowBase, 2).value =
      totalRowBase > 2 ? { formula: `SUM(B2:B${totalRowBase - 1})` } : 0;
    sheet2.getCell(totalRowBase, 3).value =
      totalRowBase > 2 ? { formula: `SUM(C2:C${totalRowBase - 1})` } : 0;

    for (let c = 1; c <= 3; c++) {
      sheet2.getCell(totalRowBase, c).font = { bold: true };
      sheet2.getCell(totalRowBase, c).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFD700" },
      };
    }

    periods.forEach((p, pIdx) => {
      const colLet = getColLetter(4 + pIdx);
      const cell = sheet2.getCell(totalRowBase, 4 + pIdx);
      cell.value =
        totalRowBase > 2
          ? { formula: `SUM(${colLet}2:${colLet}${totalRowBase - 1})` }
          : 0;
      cell.font = { bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFD700" },
      };
    });

    const finalDueCol = 4 + periods.length;
    const finalPaidCol = 5 + periods.length;
    const finalRemCol = 6 + periods.length;
    const finalAdvCol = 7 + periods.length;

    sheet2.getCell(totalRowBase, finalDueCol).value =
      totalRowBase > 2
        ? {
            formula: `SUM(${getColLetter(finalDueCol)}2:${getColLetter(finalDueCol)}${totalRowBase - 1})`,
          }
        : 0;
    sheet2.getCell(totalRowBase, finalPaidCol).value =
      totalRowBase > 2
        ? {
            formula: `SUM(${getColLetter(finalPaidCol)}2:${getColLetter(finalPaidCol)}${totalRowBase - 1})`,
          }
        : 0;
    sheet2.getCell(totalRowBase, finalRemCol).value =
      totalRowBase > 2
        ? {
            formula: `SUM(${getColLetter(finalRemCol)}2:${getColLetter(finalRemCol)}${totalRowBase - 1})`,
          }
        : 0;
    sheet2.getCell(totalRowBase, finalAdvCol).value =
      totalRowBase > 2
        ? {
            formula: `SUM(${getColLetter(finalAdvCol)}2:${getColLetter(finalAdvCol)}${totalRowBase - 1})`,
          }
        : 0;

    [finalDueCol, finalPaidCol, finalRemCol, finalAdvCol].forEach((colIdx) => {
      const cell = sheet2.getCell(totalRowBase, colIdx);
      cell.font = { bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFD700" },
      };
    });

    const expStartColSheet2 = lastClientTableColIdx + 3;

    sheet2.getCell(1, expStartColSheet2).value = "Реални фактури по месеци:";
    sheet2.getCell(1, expStartColSheet2).font = { bold: true, underline: true };
    sheet2.getCell(1, expStartColSheet2).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE5E7EB" },
    };

    periods.forEach((p, pIdx) => {
      const cell = sheet2.getCell(1, expStartColSheet2 + 1 + pIdx);
      cell.value = p.label;
      cell.font = { bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE5E7EB" },
      };
    });

    let currentExpRowSheet2 = 2;

    const managementDuesByPeriod = {};
    let hasManagementFee = false;
    periods.forEach((p) => {
      const sumForMonth = dataToProcess
        .filter((r) => r.month === p.month && r.year === p.year)
        .reduce((acc, r) => acc + Number(r.management_fee || 0), 0);
      managementDuesByPeriod[p.label] = sumForMonth;
      if (sumForMonth > 0) hasManagementFee = true;
    });

    if (hasManagementFee) {
      sheet2.getCell(currentExpRowSheet2, expStartColSheet2).value =
        "Домоуправител";
      periods.forEach((p, i) => {
        const val = managementDuesByPeriod[p.label] || 0;
        sheet2.getCell(currentExpRowSheet2, expStartColSheet2 + 1 + i).value =
          val === 0 ? null : val;
      });
      currentExpRowSheet2++;
    }

    const categoryLabels = {
      apartments: "Апартаменти",
      offices: "Офиси",
      garages: "Гаражи",
      common: "Общи",
      management: "Управление",
    };
    const activeGlobalExpenseKeys = new Set();
    const expenseDataByPeriod = {};

    expensesData.forEach((exp) => {
      const val = Number(exp.current_month || 0);
      if (val === 0 || !exp.type) return;

      const costCat = exp.cost_category || "";
      const fullKey = `${exp.type}|${costCat}`;

      if (!activeGlobalExpenseKeys.has(fullKey)) {
        const typeObj = REAL_EXPENSE_TYPES.find((t) => t.value === exp.type);
        const typeLabel = typeObj ? typeObj.label : exp.type;
        const catLabel = categoryLabels[costCat] || costCat;
        const fullLabel = catLabel ? `${typeLabel} (${catLabel})` : typeLabel;

        activeGlobalExpenseKeys.add(fullKey);
        activeGlobalExpenseKeys[fullKey] = fullLabel;
      }

      const periodKey = `${exp.month.toString().padStart(2, "0")}/${exp.year}`;
      if (!expenseDataByPeriod[periodKey]) expenseDataByPeriod[periodKey] = {};
      if (!expenseDataByPeriod[periodKey][fullKey])
        expenseDataByPeriod[periodKey][fullKey] = 0;
      expenseDataByPeriod[periodKey][fullKey] += val;
    });

    const sortedActiveExpenses = Array.from(activeGlobalExpenseKeys)
      .map((key) => ({ key, label: activeGlobalExpenseKeys[key] }))
      .sort((a, b) => a.label.localeCompare(b.label, "bg"));

    sortedActiveExpenses.forEach((exp) => {
      sheet2.getCell(currentExpRowSheet2, expStartColSheet2).value = exp.label;
      periods.forEach((p, i) => {
        const val = expenseDataByPeriod[p.label]
          ? expenseDataByPeriod[p.label][exp.key] || 0
          : 0;
        sheet2.getCell(currentExpRowSheet2, expStartColSheet2 + 1 + i).value =
          val === 0 ? null : val;
      });
      currentExpRowSheet2++;
    });

    sheet2.getCell(currentExpRowSheet2, expStartColSheet2).value =
      "Общо реални разходи:";
    sheet2.getCell(currentExpRowSheet2, expStartColSheet2).font = {
      bold: true,
    };
    sheet2.getCell(currentExpRowSheet2, expStartColSheet2).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFD700" },
    };

    periods.forEach((p, i) => {
      const colL = getColLetter(expStartColSheet2 + 1 + i);
      const cell = sheet2.getCell(
        currentExpRowSheet2,
        expStartColSheet2 + 1 + i,
      );
      cell.value =
        currentExpRowSheet2 > 2
          ? { formula: `SUM(${colL}2:${colL}${currentExpRowSheet2 - 1})` }
          : 0;
      cell.font = { bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFD700" },
      };
    });

    sheet2.getColumn(1).width = 30;
    sheet2.getColumn(2).width = 12;
    sheet2.getColumn(3).width = 12;
    for (let i = 4; i <= lastClientTableColIdx; i++)
      sheet2.getColumn(i).width = 16;
    sheet2.getColumn(expStartColSheet2).width = 32;
    for (
      let i = expStartColSheet2 + 1;
      i <= expStartColSheet2 + periods.length;
      i++
    )
      sheet2.getColumn(i).width = 15;

    [sheet1, sheet2].forEach((sheet, sheetIndex) => {
      sheet.eachRow((row, rowNumber) => {
        row.eachCell((cell, colNumber) => {
          if (sheetIndex === 0) {
            if (rowNumber <= t1Row) {
              if (colNumber === 5 && rowNumber > 1) {
                cell.numFmt = "#,##0.00";
                cell.alignment = { horizontal: "center" };
              } else if (
                colNumber > 5 &&
                colNumber <= remColIdx1 &&
                rowNumber > 1 &&
                cell.value !== null &&
                cell.value !== undefined
              ) {
                if (
                  typeof cell.value === "number" ||
                  typeof cell.value === "object"
                ) {
                  cell.numFmt = '#,##0.00" €"';
                }
              }
            }
            if (colNumber >= expStartCol) {
              if (colNumber === expStartCol && rowNumber > 1) {
                cell.alignment = { horizontal: "left" };
              } else if (
                colNumber > expStartCol &&
                rowNumber > 1 &&
                cell.value !== null &&
                cell.value !== undefined
              ) {
                if (
                  typeof cell.value === "number" ||
                  typeof cell.value === "object"
                ) {
                  cell.numFmt = '#,##0.00" €"';
                  cell.alignment = { horizontal: "right" };
                }
              }
            }
          }

          if (sheetIndex === 1) {
            if ((colNumber === 2 || colNumber === 3) && rowNumber > 1) {
              cell.numFmt = "#,##0.00";
              cell.alignment = { horizontal: "center" };
            }
            if (
              colNumber >= 4 &&
              colNumber <= lastClientTableColIdx &&
              rowNumber > 1
            ) {
              if (cell.value !== null && cell.value !== undefined) {
                cell.numFmt = '#,##0.00" €"';
                cell.alignment = { horizontal: "right" };
              }
            }
            if (colNumber >= expStartColSheet2 + 1 && rowNumber > 1) {
              if (cell.value !== null && cell.value !== undefined) {
                cell.numFmt = '#,##0.00" €"';
                cell.alignment = { horizontal: "right" };
              }
            }
          }

          if (cell.value !== null || cell.fill) {
            cell.border = {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            };
          }
        });
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const fileName =
      exportType === "current"
        ? `Справка_${safeBuildingName}_${currentMonth}_${currentYear}.xlsx`
        : `Справка_${safeBuildingName}_Период_${startMonth}.${startYear}-${endMonth}.${endYear}.xlsx`;

    saveAs(blob, fileName);
    return true;
  } catch (error) {
    console.error("Грешка при генериране на Excel:", error);
    throw error;
  }
};
