import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AsyncSelect from "react-select/async";
import { supabase } from "../../supabaseClient";
import debounce from "lodash.debounce";
import "./styles/Users.css";

function Users() {
  const [rows, setRows] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pendingScroll, setPendingScroll] = useState(null);
  const [allBuildings, setAllBuildings] = useState([]);
  const pageSize = 50;
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchBuildings = async () => {
      const { data, error } = await supabase
        .from("buildings")
        .select("id, name, address")
        .order("name", { ascending: true });
      if (!error && data) {
        setAllBuildings(
          data.map((b) => ({
            value: b.id,
            label: `${b.name}, ${b.address}`,
          }))
        );
      }
    };
    fetchBuildings();
  }, []);

  const handleSelectBuilding = async (option, keepPage = false) => {
    if (!option) {
      setSelectedBuilding(null);
      setRows([]);
      return;
    }

    setSelectedBuilding(option);
    setRows([]);
    if (!keepPage) setCurrentPage(1);

    const { data, error } = await supabase
      .from("property_units")
      .select("*")
      .eq("building_id", option.value);

    if (error) {
      console.error("Грешка при зареждане на имоти:", error);
      return;
    }

    const mappedRows = (data || []).map((r) => ({
      userId: r.user_id,
      fullName:
        [r.first_name, r.second_name, r.last_name].filter(Boolean).join(" ") ||
        "—",
      company: r.company_name || "-",
      email: r.email || "-",
      phone: r.phone || "-",
      type:
        r.type === "apartment"
          ? "Апартамент"
          : r.type === "office"
          ? "Офис"
          : r.type === "garage"
          ? "Гараж"
          : "Ритейл",
      floor: r.floor ?? "-",
      number: r.number ?? "-",
      residents: r.residents ?? "-",
      area: r.area ?? "-",
      building: {
        id: r.building_id,
        name: r.building_name,
        address: r.building_address,
      },
    }));

    setRows(mappedRows);
  };

  useEffect(() => {
    if (location.state?.previousBuilding) {
      setSelectedBuilding(location.state.previousBuilding);
      setSearchTerm(location.state.previousSearch || "");
      setCurrentPage(location.state.previousPage || 1);
      setPendingScroll(location.state.scrollPosition || 0);

      handleSelectBuilding(location.state.previousBuilding, true);
    }
  }, [location.state]);

  useEffect(() => {
    if (pendingScroll !== null && rows.length > 0) {
      setTimeout(() => {
        window.scrollTo({ top: pendingScroll, behavior: "smooth" });
        setPendingScroll(null);
      }, 100);
    }
  }, [rows, pendingScroll]);


  useEffect(() => {
    const searchUsersGlobally = debounce(async () => {
      // 1. Нулиране при празно търсене
      if (!searchTerm.trim() && !selectedBuilding) {
        setRows([]);
        return;
      }

      // 2. Ако е избрана сграда, не правим нищо (другата функция работи)
      if (selectedBuilding) return;

      const cleanTerm = searchTerm.trim().replace(/[%]/g, "");
      const searchFilter = `first_name.ilike.%${cleanTerm}%,last_name.ilike.%${cleanTerm}%,company_name.ilike.%${cleanTerm}%`;

      // 3. СТЪПКА А: Търсим хора С имоти (от property_units)
      const propertiesPromise = supabase
        .from("property_units")
        .select("*")
        .or(searchFilter)
        .limit(50);

      // 4. СТЪПКА Б: Търсим ВСИЧКИ хора (от users), които отговарят на името
      // Тук е уловката: Това ще върне и хора, които вече сме намерили в стъпка А.
      // Ще ги филтрираме по-долу.
      const usersPromise = supabase
        .from("users")
        .select("id, first_name, second_name, last_name, company_name, email, phone")
        .or(searchFilter)
        .limit(50);

      // Изпълняваме заявките паралелно за бързина
      const [propsResult, usersResult] = await Promise.all([propertiesPromise, usersPromise]);

      if (propsResult.error) console.error(propsResult.error);
      if (usersResult.error) console.error(usersResult.error);

      // 5. Обработка на резултатите
      const propertyRows = propsResult.data || [];
      const allUsers = usersResult.data || [];

      // Мапваме имотите (както досега)
      const mappedProperties = propertyRows.map((r) => ({
        userId: r.user_id,
        fullName: [r.first_name, r.second_name, r.last_name].filter(Boolean).join(" ") || "—",
        company: r.company_name,
        email: r.email,
        phone: r.phone,
        type: r.type === "apartment" ? "Апартамент" : r.type === "office" ? "Офис" : r.type === "garage" ? "Гараж" : "Ритейл",
        floor: r.floor ?? "-",
        number: r.number ?? "-",
        residents: r.residents ?? "-",
        area: r.area ?? "-",
        building: { id: r.building_id, name: r.building_name, address: r.building_address },
      }));

      // 6. Намираме потребители, които НЯМАТ имоти в резултатите
      // Създаваме Set с ID-тата на хората, които вече показахме като собственици
      const usersWithPropertiesIds = new Set(mappedProperties.map(p => p.userId));

      const usersWithoutProperties = allUsers
        .filter(u => !usersWithPropertiesIds.has(u.id)) // Филтрираме тези, които вече сме показали
        .map(u => ({
          userId: u.id,
          fullName: [u.first_name, u.second_name, u.last_name].filter(Boolean).join(" ") || "—",
          company: u.company_name,
          email: u.email,
          phone: u.phone,
          // Тъй като нямат имот:
          type: "Без имот", // Или остави "-"
          floor: "-",
          number: "-",
          residents: "-",
          area: "-",
          building: { id: null, name: "-", address: "-" }
        }));

      // 7. Слепваме двата списъка
      setRows([...mappedProperties, ...usersWithoutProperties]);
      
    }, 500);

    searchUsersGlobally();
    return () => searchUsersGlobally.cancel();
  }, [searchTerm, selectedBuilding]);

  const filteredRows = selectedBuilding
    ? rows.filter((r) =>
        r.fullName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : rows;

  const sortedRows = [...filteredRows].sort((a, b) => {
    const floorA = isNaN(Number(a.floor)) ? 9999 : Number(a.floor);
    const floorB = isNaN(Number(b.floor)) ? 9999 : Number(b.floor);
    if (floorA !== floorB) return floorA - floorB;

    const numA = parseFloat(String(a.number).replace(/[^\d.-]/g, "")) || 0;
    const numB = parseFloat(String(b.number).replace(/[^\d.-]/g, "")) || 0;

    if (numA === numB)
      return String(a.number).localeCompare(String(b.number), "bg");
    return numA - numB;
  });

  useEffect(() => {
    if (!location.state?.previousPage) {
      setCurrentPage(1);
    }
  }, [searchTerm, selectedBuilding]);

  const totalPages = Math.ceil(sortedRows.length / pageSize);
  const currentData = sortedRows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 50);
    }
  };

  const getTypeBadgeClass = (type) => {
    switch (type) {
      case "Апартамент":
        return "badge-apartment";
      case "Гараж":
        return "badge-garage";
      case "Офис":
        return "badge-office";
      case "Ритейл":
        return "badge-retail";
      default:
        return "badge-garage";
    }
  };

  return (
    <div className="users-page">
      <div className="users-header">
        <div className="users-left">
          <h1>Потребители</h1>
          <span>Подробни данни на потребителите</span>
          <p>Всеки имот (апартамент, офис, гараж) е показан на отделен ред</p>

          <input
            type="text"
            className="search-input"
            placeholder="Търсене по име..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="users-right">
          <div style={{ minWidth: "250px" }}>
            <AsyncSelect
              className="custom-select"
              classNamePrefix="custom"
              cacheOptions
              defaultOptions={allBuildings}
              loadOptions={(input) =>
                Promise.resolve(
                  allBuildings.filter((b) =>
                    b.label.toLowerCase().includes(input.toLowerCase())
                  )
                )
              }
              onChange={handleSelectBuilding}
              value={selectedBuilding}
              placeholder="Изберете сграда..."
              isClearable
            />
          </div>

          <button
            className="add-user-btn"
            onClick={() => navigate("/admin/add-user")}
          >
            Добави потребител
          </button>
          <button
            className="add-user-btn"
            onClick={() => navigate("/admin/add-user-to-building")}
          >
            Добави потребител към сграда
          </button>
        </div>
      </div>

      <table className="users-table">
        <thead>
          <tr>
            <th className="text-center" style={{ width: "50px" }}>
              №
            </th>
            <th>Име / Фирма</th>
            {!selectedBuilding && <th>Адрес</th>}
            <th>Контакти</th>
            <th>Тип имот</th>
            <th className="text-right">Етаж</th>
            <th className="text-right">Номер</th>
            <th className="text-right">Живущи</th>
            <th className="text-right">Площ (m²)</th>
          </tr>
        </thead>
        <tbody>
          {currentData.length === 0 ? (
            <tr>
              <td colSpan="8" style={{ textAlign: "center", padding: "1rem" }}>
                Изберете сграда за да видите потребителите ѝ.
              </td>
            </tr>
          ) : (
            currentData.map((row, i) => (
              <tr
                key={`${row.userId}-${i}`}
                onClick={() =>
                  navigate(`/admin/edit-user/${row.userId}`, {
                    state: {
                      buildingId: row.building?.id,
                      propertyType:
                        row.type === "Апартамент"
                          ? "apartment"
                          : row.type === "Офис"
                          ? "office"
                          : row.type === "Гараж"
                          ? "garage"
                          : row.type === "Ритейл"
                          ? "retail"
                          : null,
                      propertyNumber: row.number?.toString() || null,
                      currentPage,
                      searchTerm,
                      selectedBuilding,
                      scrollPosition: window.scrollY,
                    },
                  })
                }
                style={{ cursor: "pointer" }}
              >
                <td>{(currentPage - 1) * pageSize + i + 1}</td>
                <td data-label="Име">
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontWeight: 500, color: "#1f2937" }}>
                      {row.fullName}
                    </span>
                    {row.company && (
                      <span
                        style={{
                          fontSize: "0.85em",
                          color: "#6b7280",
                          marginTop: "2px",
                        }}
                      >
                        🏢 {row.company}
                      </span>
                    )}
                  </div>
                </td>
                {!selectedBuilding && (
                  <td
                    data-label="Адрес"
                    style={{ fontSize: "0.9em", color: "#666" }}
                  >
                    {`${row.building?.name || "-"}, ${
                      row.building?.address || "-"
                    }`}
                  </td>
                )}
                <td data-label="Контакти">
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px",
                    }}
                  >
                    {row.email ? (
                      <span style={{ fontSize: "0.9em", color: "#374151" }}>
                        {row.email}
                      </span>
                    ) : (
                      <span style={{ color: "#9ca3af", fontSize: "0.85em" }}>
                        -
                      </span>
                    )}

                    {row.phone && (
                      <span style={{ fontSize: "0.8em", color: "#6b7280" }}>
                        📞 {row.phone}
                      </span>
                    )}
                  </div>
                </td>

                <td data-label="Тип">
                  <span className={`type-badge ${getTypeBadgeClass(row.type)}`}>
                    {row.type}
                  </span>
                </td>

                <td data-label="Етаж" className="text-right tabular-nums">
                  {row.floor}
                </td>
                <td data-label="Номер" className="text-right tabular-nums">
                  {row.number}
                </td>
                <td data-label="Живущи" className="text-right tabular-nums">
                  {row.residents}
                </td>
                <td data-label="Площ" className="text-right tabular-nums">
                  {row.area}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            ◀ Предишна
          </button>
          <span>
            Страница {currentPage} от {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Следваща ▶
          </button>
        </div>
      )}
    </div>
  );
}

export default Users;
