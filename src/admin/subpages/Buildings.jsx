import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import "./styles/Buildings.css";

function Buildings() {
  const navigate = useNavigate();
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    fetchBuildings();
  }, [debouncedSearch]);

  const fetchBuildings = async () => {
    setLoading(true);

    let query = supabase
      .from("buildings")
      .select("*")
      .order("name", { ascending: true });

    if (debouncedSearch.trim() !== "") {
      query = query.or(
        `name.ilike.%${debouncedSearch.trim()}%,address.ilike.%${debouncedSearch.trim()}%`
      );
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error fetching buildings:", error);
    } else {
      setBuildings(data || []);
    }

    setLoading(false);
  };

  function formatDateTime(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${day}.${month}.${year} ${hours}:${minutes}`;
  }

  return (
    <div className="buildings-page">
      <div className="buildings-header">
        <h2>Сгради</h2>
        <div className="header-actions">
          {/* 🆕 Търсачка с debounce */}
          <input
            type="text"
            placeholder="Търси по име..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <Link to="/admin/addbuilding">
          <button className="add-building-button">Добавяне на сграда</button>
        </Link>
      </div>

      {loading ? (
        <p>Зареждане...</p>
      ) : buildings.length === 0 ? (
        <p>Няма добавени сгради</p>
      ) : (
        <table className="buildings-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Име</th>
              <th>Адрес</th>
              <th>Етажи</th>
              <th>Апартаменти</th>
              <th>Гаражи</th>
              <th>Офиси</th>
              <th>Дата на добавяне</th>
            </tr>
          </thead>
          <tbody>
            {buildings.map((b) => (
              <tr
                key={b.id}
                onClick={() => navigate(`/admin/buildings/${b.id}/edit`)}
              >
                <td data-label="ID">{b.id}</td>
                <td data-label="Име">{b.name}</td>
                <td data-label="Адрес">{b.address}</td>
                <td data-label="Етажи">{b.floors}</td>
                <td data-label="Апартаменти">{b.apartments}</td>
                <td data-label="Гаражи">{b.garages}</td>
                <td data-label="Офиси">{b.offices}</td>
                <td data-label="Дата на добавяне">
                  {formatDateTime(b.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Buildings;
