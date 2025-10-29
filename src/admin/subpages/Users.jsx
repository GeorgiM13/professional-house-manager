import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AsyncSelect from "react-select/async";
import { supabase } from "../../supabaseClient";
import "./styles/Users.css";

function Users() {
  const [users, setUsers] = useState([]);
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
                      building:buildings (
                        id,
                        name,
                        address
                      )
                    ),
                    garages (
                      number,
                      building:buildings (
                        id,
                        name,
                        address
                      )
                    ),
                    offices (
                      floor,
                      number,
                      area,
                      building:buildings (
                        id,
                        name,
                        address)
                    )
                `);

      if (error) {
        console.error("Грешка при зареждане на потребители:", error);
        return;
      }

      const mappedUsers = (data || []).map((user) => {
        const buildingsMap = {};

        (user.apartments || []).forEach((a) => {
          const b = a.building;
          if (!buildingsMap[b.id]) {
            buildingsMap[b.id] = {
              ...b,
              apartments: [],
              garages: [],
              offices: [],
            };
          }
          buildingsMap[b.id].apartments.push({
            floor: a.floor,
            number: a.number,
            residents: a.residents,
            area: a.area ?? null,
          });
        });

        (user.garages || []).forEach((g) => {
          const b = g.building;
          if (!buildingsMap[b.id]) {
            buildingsMap[b.id] = {
              ...b,
              apartments: [],
              garages: [],
              offices: [],
            };
          }
          buildingsMap[b.id].garages.push(g.number);
        });

        (user.offices || []).forEach((o) => {
          const b = o.building;
          if (!buildingsMap[b.id]) {
            buildingsMap[b.id] = {
              ...b,
              apartments: [],
              garages: [],
              offices: [],
            };
          }
          buildingsMap[b.id].offices.push({
            floor: o.floor,
            number: o.number,
            area: o.area ?? null,
          });
        });

        return {
          id: user.id,
          fullName: [user.first_name, user.second_name, user.last_name]
            .filter(Boolean)
            .join(" "),
          buildings: Object.values(buildingsMap),
        };
      });

      setUsers(mappedUsers);
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

  const filteredUsers = users.filter((u) =>
    u.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const tableRows = filteredUsers.flatMap((u, idx) => {
    const hasBuilding = u.buildings.length > 0;

    if (!hasBuilding) {
      return selectedBuilding === "all"
        ? [
            {
              idx,
              fullName: u.fullName,
              buildingName: "-",
              floor: "-",
              apartmentNumber: "-",
              residents: "-",
              garages: "-",
              office: "-",
              area: "-",
              userId: u.id,
            },
          ]
        : [];
    }

    return u.buildings
      .filter(
        (b) => selectedBuilding === "all" || b.id === Number(selectedBuilding)
      )
      .flatMap((b) => {
        const rows = [];

        (b.apartments || []).forEach((a) => {
          rows.push({
            idx,
            fullName: u.fullName,
            buildingName: `${b.name}, ${b.address}`,
            floor: a.floor || "-",
            apartmentNumber: a.number || "-",
            residents: a.residents || "-",
            garages:
              b.garages.length > 0
                ? b.garages.map((g) => `Гараж ${g}`).join(", ")
                : "-",
            office: "-",
            area: a.area || "-",
            userId: u.id,
            buildingId: b.id,
          });
        });

        (b.offices || []).forEach((o) => {
          rows.push({
            idx,
            fullName: u.fullName,
            buildingName: `${b.name}, ${b.address}`,
            floor: o.floor || "-",
            apartmentNumber: "-",
            residents: "-",
            garages:
              b.garages.length > 0
                ? b.garages.map((g) => `Гараж ${g}`).join(", ")
                : "-",
            office: `Офис ${o.number}`,
            area: o.area || "-",
            userId: u.id,
            buildingId: b.id,
          });
        });

        if (rows.length === 0) {
          rows.push({
            idx,
            fullName: u.fullName,
            buildingName: `${b.name}, ${b.address}`,
            floor: "-",
            apartmentNumber: "-",
            residents: "-",
            garages:
              b.garages.length > 0
                ? b.garages.map((g) => `Гараж ${g}`).join(", ")
                : "-",
            office: "-",
            area: "-",
            userId: u.id,
            buildingId: b.id,
          });
        }

        return rows;
      });
  });

  const sortedRows = tableRows.sort((a, b) => {
    const numA = parseInt(a.apartmentNumber);
    const numB = parseInt(b.apartmentNumber);
    if (isNaN(numA) && !isNaN(numB)) return -1;
    if (!isNaN(numA) && isNaN(numB)) return 1;
    if (isNaN(numA) && isNaN(numB)) return 0;
    return numA - numB;
  });

  return (
    <div className="users-page">
      <div className="users-header">
        <div className="users-left">
          <h1>Потребители</h1>
          <span>Подробни данни на потребителите</span>
          <p>
            Списък на потребителите, адрес, етаж, апартамент, живущи и гараж ако
            има прилежащ
          </p>
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
            <th>Етаж</th>
            <th>Апартамент</th>
            <th>Живущи</th>
            <th>Гараж</th>
            <th>Офис</th>
            <th>Площ (m²)</th>
          </tr>
        </thead>
        <tbody>
          {sortedRows.length === 0 ? (
            <tr>
              <td colSpan="7" style={{ textAlign: "center", padding: "1rem" }}>
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
                      buildingId: row.buildingId,
                      propertyType: row.office !== "-" ? "office" : "apartment",
                      propertyNumber:
                        row.office !== "-"
                          ? row.office.replace(/^Офис\s*/, "").trim()
                          : row.apartmentNumber?.toString().trim() || null,
                    },
                  })
                }
                style={{ cursor: "pointer" }}
              >
                <td data-label="№:">{row.idx + 1}</td>
                <td data-label="Име:">{row.fullName}</td>
                <td data-label="Адрес:">{row.buildingName}</td>
                <td data-label="Етаж:">{row.floor}</td>
                <td data-label="Апартамент:">{row.apartmentNumber}</td>
                <td data-label="Живущи:">{row.residents}</td>
                <td data-label="Гаражи:">{row.garages}</td>
                <td data-label="Офис:">{row.office}</td>
                <td data-label="Площ (m²):">{row.area}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Users;
