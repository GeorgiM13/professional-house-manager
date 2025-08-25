import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import AsyncSelect from "react-select/async"
import { supabase } from "../../supabaseClient"
import "./styles/Users.css"

function Users() {
    const [users, setUsers] = useState([]);
    const [selectedBuilding, setSelectedBuilding] = useState("all");
    const navigate = useNavigate();

    useEffect(() => {
        async function fetchUsers() {
            const { data, error } = await supabase
                .from("users")
                .select(`
                    id,
                    first_name,
                    second_name,
                    last_name,
                    apartments (
                      floor,
                      number,
                      residents,
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
                        buildingsMap[b.id] = { ...b, apartments: [], garages: [] };
                    }
                    buildingsMap[b.id].apartments.push({
                        floor: a.floor,
                        number: a.number,
                        residents: a.residents,
                    });
                });

                (user.garages || []).forEach((g) => {
                    const b = g.building;
                    if (!buildingsMap[b.id]) {
                        buildingsMap[b.id] = { ...b, apartments: [], garages: [] };
                    }
                    buildingsMap[b.id].garages.push(g.number);
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
        const mapped = (data || []).map(b => ({
            value: b.id,
            label: `${b.name}, ${b.address}`
        }));
        return [allOption, ...mapped];
    };

    const tableRows = users.flatMap((u, idx) => {
        const hasBuilding = u.buildings.length > 0;

        if (!hasBuilding) {
            return selectedBuilding === "all"
                ? [{
                    idx,
                    fullName: u.fullName,
                    buildingName: "Няма сграда",
                    floor: "Няма етаж",
                    apartmentNumber: "Няма апартамент",
                    residents: "Няма живущи",
                    garages: "Няма гараж",
                    userId: u.id,
                }]
                : [];
        }

        return u.buildings
            .filter(b => selectedBuilding === "all" || b.id === Number(selectedBuilding))
            .flatMap(b =>
                b.apartments.length > 0
                    ? b.apartments.map(a => ({
                        idx,
                        fullName: u.fullName,
                        buildingName: `${b.name}, ${b.address}`,
                        floor: a.floor,
                        apartmentNumber: a.number,
                        residents: a.residents,
                        garages: b.garages.length > 0 ? b.garages.map(g => `Гараж ${g}`).join(", ") : "Няма гараж",
                        userId: u.id,
                        buildingId: b.id,
                    }))
                    : [{
                        idx,
                        fullName: u.fullName,
                        buildingName: `${b.name}, ${b.address}`,
                        floor: "Няма етаж",
                        apartmentNumber: "Няма апартамент",
                        residents: "Няма живущи",
                        garages: b.garages.length > 0 ? b.garages.map(g => `Гараж ${g}`).join(", ") : "Няма гараж",
                        userId: u.id,
                        buildingId: b.id,
                    }]
            );
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
                    <p>Списък на потребителите, адрес, етаж, апартамент, живущи и гараж ако има прилежащ</p>
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
                    <button className="add-user-btn" onClick={() => navigate("/admin/add-user")}>
                        Добави потребител
                    </button>
                    <button className="add-user-btn" onClick={() => navigate("/admin/add-user-to-building")}>
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
                        <th>Гаражи</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedRows.length === 0 ? (
                        <tr>
                            <td colSpan="7" style={{ textAlign: "center", padding: "1rem" }}>Няма намерени потребители.</td>
                        </tr>
                    ) : (
                        sortedRows.map((row, i) => (
                            <tr
                                key={`${row.userId}-${i}`}
                                onClick={() => navigate(`/admin/edit-user/${row.userId}`, { state: { buildingId: row.buildingId } })}
                                style={{ cursor: "pointer" }}
                            >
                                <td data-label="№:">{row.idx + 1}</td>
                                <td data-label="Име:">{row.fullName}</td>
                                <td data-label="Адрес:">{row.buildingName}</td>
                                <td data-label="Етаж:">{row.floor}</td>
                                <td data-label="Апартамент:">{row.apartmentNumber}</td>
                                <td data-label="Живущи:">{row.residents}</td>
                                <td data-label="Гаражи:">{row.garages}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default Users;
