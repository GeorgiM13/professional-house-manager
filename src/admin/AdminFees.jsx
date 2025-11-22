import { useState, useEffect } from "react";
import AsyncSelect from "react-select/async";
import { supabase } from "../supabaseClient";
import { generateFees } from "../algorithms/fees";
import "./styles/AdminFees.css";

function AdminFees() {
  const [fees, setFees] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const loadBuildings = async (inputValue) => {
    const { data, error } = await supabase
      .from("buildings")
      .select("id, name, address")
      .ilike("name", `%${inputValue}%`)
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
        object_number,
        type,
        floor,
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
      .eq("month", month)
      .eq("year", year);

    if (error) {
      console.error("Грешка при зареждане на такси:", error);
      return;
    }

    setFees(data || []);
  };

  async function handleGenerateFees() {
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

   const sortedFees = [...fees].sort((a, b) => {
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

  return (
    <div className="fees-page">
      <div className="fees-header">
        <h1>Събиране на такси</h1>

        <div className="building-select">
          <label>Сграда:</label>
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

        <button className="generate-btn" onClick={handleGenerateFees}>
          Генерирай такси
        </button>
      </div>

      <table className="fees-table">
        <thead>
          <tr>
            <th>Обект</th>
            <th>Вид</th>
            <th>Етаж</th>
            <th>Клиент</th>
            <th>Задължения за текущ месец</th>
            <th>Задължения общо</th>
            <th>Статус</th>
            <th>Действие</th>
          </tr>
        </thead>
        <tbody>
          {sortedFees.length > 0 ? (
            sortedFees.map((fee) => (
              <tr key={fee.id}>
                <td>{fee.object_number}</td>
                <td>{fee.type}</td>
                <td>{fee.floor || "-"}</td>
                <td>
                  {fee.users
                    ? `${fee.users.first_name} ${fee.users.second_name || ""} ${
                        fee.users.last_name
                      }`
                    : "-"}
                </td>
                <td>{fee.current_month_due?.toFixed(2) || 0} лв.</td>
                <td>{fee.total_due?.toFixed(2) || 0} лв.</td>
                <td>
                  {fee.paid ? (
                    <span className="status-badge status-done">Платено</span>
                  ) : (
                    <span className="status-badge status-new">Неплатено</span>
                  )}
                </td>
                <td>
                  <button className="pay-button">Плати с карта</button>
                </td>
              </tr>
            ))
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
