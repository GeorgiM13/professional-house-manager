import { useState, useEffect, Fragment, useMemo } from "react";
import AsyncSelect from "react-select/async";
import { supabase } from "../supabaseClient";
import { generateFees } from "../algorithms/fees";
import "./styles/AdminFees.css";



const AnimatedCounter = ({ value, duration = 1000 }) => {
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

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [value]);

  return <>{count.toFixed(2)}</>;
};



function AdminFees() {
  const [fees, setFees] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [expandedUsers, setExpandedUsers] = useState({});
  const [groupByClient, setGroupByClient] = useState(true);

  const loadBuildings = async (inputValue) => {
    const { data, error } = await supabase
      .from("buildings")
      .select("id, name, address")
      .ilike("name", `%${inputValue || ""}%`)
      .limit(10);

    if (error) {
      console.error("Грешка при зареждане на сгради:", error);
      return [];
    }

    return data.map((b) => ({
      value: b.id,
      label: `${b.name}, ${b.address}`,
    }));
  };

  useEffect(() => {
    if (
      selectedBuilding &&
      selectedBuilding !== "all" &&
      selectedMonth &&
      selectedYear
    ) {
      fetchFees(selectedBuilding, selectedMonth, selectedYear);
    } else {
      setFees([]);
    }
  }, [selectedBuilding, selectedMonth, selectedYear]);

  const fetchFees = async (buildingId, month, year) => {
    const { data, error } = await supabase
      .from("fees")
      .select(
        `
        id,
        building_id,
        client_id,
        object_number,
        type,
        floor,
        month,
        year,
        current_month_due,
        total_due,
        paid,
        users (
          id,
          first_name,
          second_name,
          last_name
        )
      `
      )
      .eq("building_id", buildingId)
      .or(`year.lt.${year},and(year.eq.${year},month.lte.${month})`);

    if (error) {
      console.error("Грешка при зареждане на такси:", error);
      return;
    }

    setFees(data || []);
  };

  async function handleGenerateFees() {
    if (!selectedBuilding || selectedBuilding === "all") {
      alert("Моля, изберете сграда преди да генерирате такси.");
      return;
    }
    try {
      const { data: building, error } = await supabase
        .from("buildings")
        .select("fee_algorithm")
        .eq("id", selectedBuilding)
        .single();

      if (error) throw error;

      const algorithmType = building?.fee_algorithm || "base";

      const count = await generateFees(
        selectedBuilding,
        selectedMonth,
        selectedYear,
        algorithmType
      );

      alert(`✅ Генерирани са ${count} такси по алгоритъм "${algorithmType}".`);
      await fetchFees(selectedBuilding, selectedMonth, selectedYear);
    } catch (err) {
      alert("⚠️ " + err.message);
    }
  }

  const months = [
    { value: 1, label: "Януари" },
    { value: 2, label: "Февруари" },
    { value: 3, label: "Март" },
    { value: 4, label: "Април" },
    { value: 5, label: "Май" },
    { value: 6, label: "Юни" },
    { value: 7, label: "Юли" },
    { value: 8, label: "Август" },
    { value: 9, label: "Септември" },
    { value: 10, label: "Октомври" },
    { value: 11, label: "Ноември" },
    { value: 12, label: "Декември" },
  ];

  const years = Array.from(
    { length: 10 },
    (_, i) => new Date().getFullYear() - i
  );

  const getObjectKey = (row) =>
    `${row.client_id}|${row.object_number}|${row.type}|${row.floor ?? ""}`;

  async function payCurrent(fee) {
    const currentPaid = Number(fee.paid || 0);
    const toPay = Number(fee.current_month_due || 0);
    const total = Number(fee.total_due || 0);

    const newPaid = Math.min(currentPaid + toPay, total);

    const { error } = await supabase
      .from("fees")
      .update({ paid: newPaid })
      .eq("id", fee.id);

    if (error) {
      alert("Грешка при плащане: " + error.message);
    } else {
      await fetchFees(selectedBuilding, selectedMonth, selectedYear);
    }
  }

  async function payAll(fee) {
    const { error } = await supabase.rpc("pay_all_fees_for_object", {
      p_building_id: fee.building_id,
      p_client_id: fee.client_id,
      p_object_number: fee.object_number,
      p_type: fee.type,
      p_floor: fee.floor,
      p_year: selectedYear,
      p_month: selectedMonth,
    });

    if (error) {
      alert("Грешка при плащане на всички: " + error.message);
    } else {
      await fetchFees(selectedBuilding, selectedMonth, selectedYear);
    }
  }

  const allFees = fees || [];
  const currentFees = useMemo(
    () =>
      allFees.filter(
        (f) => f.month === selectedMonth && f.year === selectedYear
      ),
    [allFees, selectedMonth, selectedYear]
  );

  const historyByObject = useMemo(() => {
    const map = {};
    allFees.forEach((row) => {
      const key = getObjectKey(row);
      if (!map[key]) map[key] = [];
      map[key].push(row);
    });
    return map;
  }, [allFees]);

  const remainingByObject = useMemo(() => {
    const res = {};
    Object.entries(historyByObject).forEach(([key, history]) => {
      const remainingForObject = history.reduce((acc, row) => {
        const total = Number(row.total_due || 0);
        const paid = Number(row.paid || 0);
        return acc + Math.max(total - paid, 0);
      }, 0);
      res[key] = remainingForObject;
    });
    return res;
  }, [historyByObject]);

  const sortedFees = useMemo(() => {
    return [...currentFees].sort((a, b) => {
      const floorA = isNaN(Number(a.floor)) ? 9999 : Number(a.floor);
      const floorB = isNaN(Number(b.floor)) ? 9999 : Number(b.floor);
      if (floorA !== floorB) return floorA - floorB;

      const numA =
        parseFloat(String(a.object_number).replace(/[^\d.-]/g, "")) || 0;
      const numB =
        parseFloat(String(b.object_number).replace(/[^\d.-]/g, "")) || 0;

      if (numA === numB) {
        return String(a.object_number).localeCompare(
          String(b.object_number),
          "bg"
        );
      }
      return numA - numB;
    });
  }, [currentFees]);

  const userGroups = useMemo(() => {
    const groups = [];
    const map = new Map();

    sortedFees.forEach((fee) => {
      const key = fee.client_id;
      if (!map.has(key)) {
        const fullName = fee.users
          ? `${fee.users.first_name} ${fee.users.second_name || ""} ${
              fee.users.last_name
            }`.trim()
          : "—";

        const group = {
          clientId: key,
          name: fullName,
          rows: [],
        };
        map.set(key, group);
        groups.push(group);
      }
      map.get(key).rows.push(fee);
    });

    return groups;
  }, [sortedFees]);

  const totalRemainingByUser = useMemo(() => {
    const res = {};
    userGroups.forEach((group) => {
      const total = group.rows.reduce((sum, fee) => {
        const key = getObjectKey(fee);
        return sum + (remainingByObject[key] || 0);
      }, 0);
      res[group.clientId] = total;
    });
    return res;
  }, [userGroups, remainingByObject]);

  useEffect(() => {
    setExpandedUsers((prev) => {
      const next = { ...prev };
      userGroups.forEach((g) => {
        if (next[g.clientId] === undefined) {
          next[g.clientId] = false;
        }
      });
      return next;
    });
  }, [userGroups]);

  const toggleUser = (clientId) => {
    setExpandedUsers((prev) => ({
      ...prev,
      [clientId]: !prev[clientId],
    }));
  };

  const renderFeeRow = (fee) => {
    const key = getObjectKey(fee);
    const remainingForObject = remainingByObject[key] || 0;

    const totalForRow = Number(fee.total_due || 0);
    const paidForRow = Number(fee.paid || 0);
    const rowRemaining = Math.max(totalForRow - paidForRow, 0);

    const currentDue = Number(fee.current_month_due || fee.total_due || 0);

    const isPaidCurrentMonth = rowRemaining <= 0.01;
    const isFullyPaid = remainingForObject <= 0.01;

    let amountClass = "amount-debt-current";
    if (isFullyPaid) amountClass = "amount-paid";
    else if (remainingForObject > rowRemaining + 0.1)
      amountClass = "amount-debt-old";

    return (
      <tr key={fee.id}>
        <td>
          <span style={{ fontWeight: "600" }}>{fee.object_number}</span>
        </td>
        <td style={{ color: "#64748b", fontSize: "0.9em" }}>{fee.type}</td>
        <td>{fee.floor || "-"}</td>
        <td>
          {fee.users ? (
            `${fee.users.first_name} ${fee.users.second_name || ""} ${
              fee.users.last_name
            }`
          ) : (
            <span style={{ color: "#94a3b8", fontStyle: "italic" }}>
              Няма ползвател
            </span>
          )}
        </td>

        <td className="text-right tabular-nums">{currentDue.toFixed(2)} лв.</td>

        <td className="text-right tabular-nums">
          <span className={amountClass} style={{ fontSize: "1.05em" }}>
            {remainingForObject.toFixed(2)} лв.
          </span>
        </td>

        <td style={{ textAlign: "center" }}>
          {isPaidCurrentMonth ? (
            <span className="status-badge status-paid">Платено</span>
          ) : (
            <span className="status-badge status-unpaid">Неплатено</span>
          )}
        </td>

        <td>
          <div className="actions-cell">
            {!isPaidCurrentMonth && (
              <button
                className="btn-action btn-secondary"
                onClick={() => payCurrent(fee)}
                title="Плати само текущото задължение"
              >
                Текущо
              </button>
            )}

            {!isFullyPaid && (
              <button
                className="btn-action btn-primary"
                onClick={() => payAll(fee)}
                title="Изчисти всички задължения"
              >
                Всичко
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  };

  const stats = useMemo(() => {
    let totalToCollect = 0;
    let totalCollected = 0;

    currentFees.forEach((f) => {
      totalToCollect += Number(f.current_month_due || 0);
      totalCollected += Number(f.paid || 0);
    });

    const progress =
      totalToCollect > 0 ? (totalCollected / totalToCollect) * 100 : 0;

    return { totalToCollect, totalCollected, progress };
  }, [currentFees]);

  return (
    <div className="fees-page">
      <div className="fees-header">
        <h1>Събиране на такси</h1>

        <div className="building-select">
          <AsyncSelect
            className="custom-select"
            classNamePrefix="custom"
            cacheOptions
            defaultOptions
            loadOptions={loadBuildings}
            onChange={(option) => {
              setSelectedBuilding(option ? option.value : "all");
            }}
            placeholder="Изберете сграда"
            isClearable
          />
        </div>

        <div className="month-select">
          <label>Месец:</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div className="year-select">
          <label>Година:</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div className="fees-view-toggle">
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={groupByClient}
              onChange={() => setGroupByClient((prev) => !prev)}
            />
            <span className="slider"></span>
            <span className="label-text">Групирай по клиенти</span>
          </label>
        </div>

        <button className="generate-btn" onClick={handleGenerateFees}>
          Генерирай такси
        </button>
      </div>

      <div className="summary-bar">
        <div className="summary-card">
          <div className="summary-label">Очаквани приходи (месец)</div>
          <div className="summary-value val-dark">
            <AnimatedCounter value={stats.totalToCollect} /> лв.
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-label">Събрани до момента</div>
          <div className="summary-value val-green">
            <AnimatedCounter value={stats.totalCollected} /> лв.
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-label">Събираемост</div>
          <div className="progress-container">
            <div className="summary-value val-blue">
              <AnimatedCounter value={stats.progress} />%
            </div>

            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${stats.progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <table className="fees-table">
        <thead>
          <tr>
            <th>Обект</th>
            <th>Вид</th>
            <th>Етаж</th>
            <th>Клиент</th>
            <th className="text-right">Текуща такса</th>
            <th className="text-right">Общо дължи</th>
            <th style={{ textAlign: "center" }}>Статус</th>
            <th className="text-right">Действие</th>
          </tr>
        </thead>
        <tbody>
          {userGroups.length > 0 ? (
            groupByClient ? (
              userGroups.map((group) => {
                const totalRemainingForUser =
                  totalRemainingByUser[group.clientId] ?? 0;
                const isExpanded = expandedUsers[group.clientId] ?? false;

                return (
                  <Fragment key={group.clientId}>
                    <tr
                      className="user-group-header"
                      onClick={() => toggleUser(group.clientId)}
                    >
                      <td colSpan="8">
                        <div className="user-group-header-inner">
                          <span className="user-toggle-icon">
                            {isExpanded ? "▾" : "▸"}
                          </span>
                          <span className="user-name">{group.name}</span>
                          <span className="user-total-debt">
                            Общо задължения: {totalRemainingForUser.toFixed(2)}{" "}
                            лв.
                          </span>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && group.rows.map(renderFeeRow)}
                  </Fragment>
                );
              })
            ) : (
              sortedFees.map(renderFeeRow)
            )
          ) : (
            <tr>
              <td colSpan="8" style={{ textAlign: "center", color: "#777" }}>
                Няма данни за избраната сграда и месец.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default AdminFees;
