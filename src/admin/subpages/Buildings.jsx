import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../../components/ThemeContext";
import { useLocalUser } from "../hooks/UseLocalUser";
import { useUserBuildings } from "../hooks/UseUserBuildings";
import {
  Building2,
  Home,
  Car,
  Search,
  Loader2,
  Plus,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import "./styles/Buildings.css";

const ITEMS_PER_PAGE = 20;

function Buildings() {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  const { userId } = useLocalUser();
  const { buildings: allBuildings, loading } = useUserBuildings(userId);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const filteredBuildings = useMemo(() => {
    if (!debouncedSearch) return allBuildings;
    const lowerTerm = debouncedSearch.toLowerCase();
    return allBuildings.filter(
      (b) =>
        (b.name && b.name.toLowerCase().includes(lowerTerm)) ||
        (b.address && b.address.toLowerCase().includes(lowerTerm)),
    );
  }, [allBuildings, debouncedSearch]);

  const paginatedBuildings = useMemo(() => {
    const from = (page - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE;
    return filteredBuildings.slice(from, to);
  }, [filteredBuildings, page]);

  const globalStats = useMemo(() => {
    return allBuildings.reduce(
      (acc, b) => ({
        apts: acc.apts + (Number(b.apartments) || 0),
        garages: acc.garages + (Number(b.garages) || 0),
        offices: acc.offices + (Number(b.offices) || 0),
      }),
      { apts: 0, garages: 0, offices: 0 },
    );
  }, [allBuildings]);

  const totalPages = Math.ceil(filteredBuildings.length / ITEMS_PER_PAGE);

  function formatDateTime(dateString) {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("bg-BG", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }

  return (
    <div className={`ab-page ${isDarkMode ? "ab-dark" : "ab-light"}`}>
      <div className="ab-header">
        <div className="ab-header-left">
          <h1>Сгради</h1>
          <p>Управление на жилищния фонд</p>
        </div>
        <Link to="/admin/addbuilding" className="ab-link-reset">
          <button className="ab-add-btn">
            <Plus size={18} strokeWidth={2.5} />
            Добави сграда
          </button>
        </Link>
      </div>

      <div className="ab-stats-grid">
        <div className="ab-stat-card blue">
          <div className="ab-stat-icon">
            <Building2 size={24} strokeWidth={2.5} />
          </div>
          <div className="ab-stat-info">
            <span className="label">Общо сгради</span>
            <span className="value">{allBuildings.length}</span>
          </div>
        </div>
        <div className="ab-stat-card purple">
          <div className="ab-stat-icon">
            <Home size={24} strokeWidth={2.5} />
          </div>
          <div className="ab-stat-info">
            <span className="label">Апартаменти</span>
            <span className="value">{globalStats.apts}</span>
          </div>
        </div>
        <div className="ab-stat-card green">
          <div className="ab-stat-icon">
            <Car size={24} strokeWidth={2.5} />
          </div>
          <div className="ab-stat-info">
            <span className="label">Гаражи</span>
            <span className="value">{globalStats.garages}</span>
          </div>
        </div>
      </div>

      <div className="ab-toolbar">
        <div className="ab-search-wrapper">
          <Search className="search-icon" size={18} strokeWidth={2.5} />
          <input
            type="text"
            placeholder="Търсене по име или адрес..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="ab-search-input"
          />
        </div>
      </div>

      {loading ? (
        <div className="ab-loading">
          <Loader2 size={20} strokeWidth={2.5} className="spinner" />
          <span>Зареждане...</span>
        </div>
      ) : filteredBuildings.length === 0 ? (
        <div className="ab-empty">Няма намерени сгради</div>
      ) : (
        <>
          <div className="ab-table-responsive desktop-view">
            <div className="ab-table-wrapper">
              <table className="ab-table">
                <thead>
                  <tr>
                    <th>Име</th>
                    <th>Адрес</th>
                    <th className="text-center">Ет.</th>
                    <th className="text-center">Ап.</th>
                    <th className="text-center">Оф.</th>
                    <th className="text-center">Гар.</th>
                    <th className="text-right">Добавена</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedBuildings.map((b) => (
                    <tr
                      key={b.id}
                      onClick={() => navigate(`/admin/buildings/${b.id}/edit`)}
                      className="ab-row"
                    >
                      <td className="fw-bold text-main">{b.name}</td>
                      <td className="text-sec">{b.address}</td>
                      <td className="text-center">{b.floors || 0}</td>
                      <td className="text-center">{b.apartments || 0}</td>
                      <td className="text-center">{b.offices || 0}</td>
                      <td className="text-center">{b.garages || 0}</td>
                      <td className="text-right text-small">
                        {formatDateTime(b.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="ab-mobile-list mobile-view">
            {paginatedBuildings.map((b) => (
              <div
                key={b.id}
                className="ab-card"
                onClick={() => navigate(`/admin/buildings/${b.id}/edit`)}
              >
                <div className="ab-card-header">
                  <div className="ab-card-title">
                    <Building2
                      size={18}
                      strokeWidth={2.5}
                      className="ab-card-icon"
                    />
                    {b.name}
                  </div>
                  <span className="ab-card-date">
                    {formatDateTime(b.created_at)}
                  </span>
                </div>
                <div className="ab-card-address">
                  <MapPin
                    size={16}
                    strokeWidth={2.5}
                    className="ab-address-icon"
                  />
                  <span>{b.address}</span>
                </div>

                <div className="ab-card-stats">
                  <div className="stat-pill">
                    <span>Ет:</span> <b>{b.floors || 0}</b>
                  </div>
                  <div className="stat-pill">
                    <span>Ап:</span> <b>{b.apartments || 0}</b>
                  </div>
                  <div className="stat-pill">
                    <span>Оф:</span> <b>{b.offices || 0}</b>
                  </div>
                  <div className="stat-pill">
                    <span>Гар:</span> <b>{b.garages || 0}</b>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="ab-pagination">
              <button
                className="ab-pagination-btn prev-btn"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft
                  size={18}
                  strokeWidth={2.5}
                  className="ab-icon-slide-left"
                />
                <span className="ab-pagination-btn-text">Предишна</span>
              </button>

              <div className="ab-pagination-info">
                <span className="ab-page-word">Страница </span>
                <span className="ab-page-numbers">
                  {page}
                  <span className="ab-page-separator"> от </span>
                  <span className="ab-page-slash"> / </span>
                  {totalPages}
                </span>
              </div>

              <button
                className="ab-pagination-btn next-btn"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <span className="ab-pagination-btn-text">Следваща</span>
                <ChevronRight
                  size={18}
                  strokeWidth={2.5}
                  className="ab-icon-slide-right"
                />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Buildings;
