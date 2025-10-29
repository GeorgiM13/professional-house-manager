import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AsyncSelect from "react-select/async";
import { supabase } from "../../supabaseClient";
import "./styles/Users.css";

function Users() {
  const [rows, setRows] = useState([]); // 🔹 Преименувано от users → rows
  const [selectedBuilding, setSelectedBuilding] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchUsers() {
      const { data, error } = await supabase.from("users").select(`
        id,
        first_name,
        second_name,
        last_name,
        apartments (
          floor,
          number,
          residents,
          area,
          building:buildings ( id, name, address )
        ),
        garages (
          floor,
          number,
          area,
          building:buildings ( id, name, address )
        ),
        offices (
          floor,
          number,
          area,
          building:buildings ( id, name, address )
        )
      `);

      if (error) {
        console.error("Грешка при зареждане на потребители:", error);
        return;
      }

      const mappedRows = (data || []).flatMap((user) => {
        const fullName = [user.first_name, user.second_name, user.last_name]
          .filter(Boolean)
          .join(" ");
        const rows = [];

        (user.apartments || []).forEach((a) => {
          rows.push({
            userId: user.id,
            fullName,
            type: "Апартамент",
            floor: a.floor ?? "-",
            number: a.number ?? "-",
            residents: a.residents ?? "-",
            area: a.area ?? "-",
            building: a.building,
          });
        });

        (user.offices || []).forEach((o) => {
          rows.push({
            userId: user.id,
            fullName,
            type: "Офис",
            floor: o.floor ?? "-",
            number: o.number ?? "-",
            residents: "-",
            area: o.area ?? "-",
            building: o.building,
          });
        });

        (user.garages || []).forEach((g) => {
          rows.push({
            userId: user.id,
            fullName,
            type: "Гараж",
            floor: g.floor ?? "-",
            number: g.number ?? "-",
            residents: "-",
            area: g.area ?? "-",
            building: g.building,
          });
        });

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
    }

    fetchUsers();
  }, []);

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

    const allOption = { value: "all", label: "Всички сгради" };
    const mapped = (data || []).map((b) => ({
      value: b.id,
      label: `${b.name}, ${b.address}`,
    }));
    return [allOption, ...mapped];
  };

  const filteredRows = rows.filter((r) => {
    const matchName = r.fullName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchBuilding =
      selectedBuilding === "all" ||
      Number(r.building?.id) === Number(selectedBuilding);
    return matchName && matchBuilding;
  });

  const sortedRows = [...filteredRows].sort((a, b) => {
    const floorA = isNaN(Number(a.floor)) ? 9999 : Number(a.floor);
    const floorB = isNaN(Number(b.floor)) ? 9999 : Number(b.floor);
    return floorA - floorB;
  });

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
              defaultOptions
              loadOptions={loadBuildings}
              onChange={(option) => setSelectedBuilding(option?.value || "all")}
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
          {sortedRows.length === 0 ? (
            <tr>
              <td colSpan="8" style={{ textAlign: "center", padding: "1rem" }}>
                Няма намерени потребители.
              </td>
            </tr>
          ) : (
            sortedRows.map((row, i) => (
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
                          : null,
                      propertyNumber: row.number?.toString() || null,
                    },
                  })
                }
                style={{ cursor: "pointer" }}
              >
                <td>{i + 1}</td>
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
    </div>
  );
}

export default Users;
