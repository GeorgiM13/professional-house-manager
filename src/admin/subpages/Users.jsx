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
      if (!searchTerm.trim() && !selectedBuilding) {
        setRows([]);
        return;
      }

      if (selectedBuilding) return;

      const cleanTerm = searchTerm.trim().replace(/[%]/g, "");
      const { data, error } = await supabase
        .from("users")
        .select(
          `
            id,
            first_name,
            second_name,
            last_name,
            apartments(floor, number, residents, area, building:buildings(id, name, address)),
            garages(floor, number, area, building:buildings(id, name, address)),
            offices(floor, number, area, building:buildings(id, name, address)),
            retails(floor, number, area, building:buildings(id, name, address))
          `
        )
        .or(
          `first_name.ilike.%${cleanTerm}%,second_name.ilike.%${cleanTerm}%,last_name.ilike.%${cleanTerm}%`
        )
        .limit(100);

      if (error) {
        console.error("Грешка при глобално търсене:", error);
        return;
      }

      const mappedRows = (data || []).flatMap((user) => {
        const fullName = [user.first_name, user.second_name, user.last_name]
          .filter(Boolean)
          .join(" ");
        const rows = [];

        const push = (items, type, hasResidents = false) => {
          (items || []).forEach((x) =>
            rows.push({
              userId: user.id,
              fullName,
              type,
              floor: x.floor ?? "-",
              number: x.number ?? "-",
              residents: hasResidents ? x.residents ?? "-" : "-",
              area: x.area ?? "-",
              building: x.building,
            })
          );
        };

        push(user.apartments, "Апартамент", true);
        push(user.offices, "Офис");
        push(user.garages, "Гараж");
        push(user.retails, "Ритейл");

        if (rows.length === 0) {
          rows.push({
            userId: user.id,
            fullName,
            type: "-",
            floor: "-",
            number: "-",
            residents: "-",
            area: "-",
            building: { id: null, name: "-", address: "-" },
          });
        }

        return rows;
      });

      setRows(mappedRows);
    }, 400);

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
            <th>№</th>
            <th>Име</th>
            <th>Адрес</th>
            <th>Тип имот</th>
            <th>Етаж</th>
            <th>Номер</th>
            <th>Живущи</th>
            <th>Площ (m²)</th>
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
                <td>{row.fullName}</td>
                <td>{`${row.building?.name || "-"}, ${
                  row.building?.address || "-"
                }`}</td>
                <td>{row.type}</td>
                <td>{row.floor}</td>
                <td>{row.number}</td>
                <td>{row.residents}</td>
                <td>{row.area}</td>
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
