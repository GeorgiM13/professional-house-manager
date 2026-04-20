import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import debounce from "lodash.debounce";
import { useTheme } from "../../components/ThemeContext";
import {
  Plus,
  Globe,
  Shield,
  Smartphone,
  Search,
  Loader2,
  User,
  Building2,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import "./styles/Users.css";

const CountUp = ({ value, duration = 800 }) => {
  const [displayValue, setDisplayValue] = useState(0);
  useEffect(() => {
    let start = 0;
    let startTime = null;
    let frame;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(start + (value - start) * easeProgress);
      if (progress < 1) frame = requestAnimationFrame(animate);
      else setDisplayValue(value);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);
  return <>{Math.round(displayValue)}</>;
};

function GlobalUsers() {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [stats, setStats] = useState({ total: 0, admins: 0, withPhone: 0 });

  const PAGE_SIZE = 20;

  useEffect(() => {
    const fetchStats = async () => {
      const totalPromise = supabase
        .from("users")
        .select("id", { count: "exact", head: true });
      const adminsPromise = supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("role", "admin");
      const phonePromise = supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .not("phone", "is", null)
        .neq("phone", "");

      const [totalRes, adminsRes, phoneRes] = await Promise.all([
        totalPromise,
        adminsPromise,
        phonePromise,
      ]);

      setStats({
        total: totalRes.count || 0,
        admins: adminsRes.count || 0,
        withPhone: phoneRes.count || 0,
      });
    };

    fetchStats();
  }, []);

  const fetchUsers = async (pageArg, searchArg) => {
    setLoading(true);
    try {
      let query = supabase.from("users").select("*", { count: "exact" });

      if (searchArg) {
        const clean = searchArg.trim();
        query = query.or(
          `first_name.ilike.%${clean}%,last_name.ilike.%${clean}%,email.ilike.%${clean}%,phone.ilike.%${clean}%`,
        );
      }

      const from = (pageArg - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, count, error } = await query
        .range(from, to)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setUsers(data || []);
      setTotal(count || 0);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  const debouncedFetch = useMemo(
    () => debounce((p, s) => fetchUsers(p, s), 500),
    [],
  );

  useEffect(() => {
    debouncedFetch(page, searchTerm);
    return () => debouncedFetch.cancel();
  }, [page, searchTerm]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className={`au-page ${isDarkMode ? "au-dark" : "au-light"}`}>
      <div className="au-header">
        <div className="au-header-left">
          <h1>Глобален регистър</h1>
          <p>Търсене и редакция на всички регистрирани потребители</p>
        </div>
        <div className="au-header-right">
          <button
            className="au-btn-primary"
            onClick={() => navigate("/admin/add-user")}
          >
            <Plus size={18} strokeWidth={2.5} /> Нов Потребител
          </button>
        </div>
      </div>

      <div className="au-stats-container">
        <div className="au-stat-card blue">
          <div className="au-stat-icon">
            <Globe size={24} strokeWidth={2.5} />
          </div>
          <div className="au-stat-content">
            <span className="au-stat-label">Общо потребители</span>
            <span className="au-stat-value">
              <CountUp value={stats.total} />
            </span>
          </div>
        </div>
        <div className="au-stat-card purple">
          <div className="au-stat-icon">
            <Shield size={24} strokeWidth={2.5} />
          </div>
          <div className="au-stat-content">
            <span className="au-stat-label">Администратори</span>
            <span className="au-stat-value">
              <CountUp value={stats.admins} />
            </span>
          </div>
        </div>
        <div className="au-stat-card orange">
          <div className="au-stat-icon">
            <Smartphone size={24} strokeWidth={2.5} />
          </div>
          <div className="au-stat-content">
            <span className="au-stat-label">С телефон</span>
            <span className="au-stat-value">
              <CountUp value={stats.withPhone} />
            </span>
          </div>
        </div>
      </div>
      <div className="au-toolbar">
        <div className="au-search-wrapper">
          <Search className="au-search-icon" size={18} strokeWidth={2.5} />
          <input
            type="text"
            className="au-search-input"
            placeholder="Търсене по име, email, телефон..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {loading ? (
        <div className="au-loading-state">
          <Loader2 className="au-loading-spinner" size={24} strokeWidth={2.5} />
          <span>Зареждане...</span>
        </div>
      ) : (
        <>
          <table className="au-table desktop-view">
            <thead>
              <tr>
                <th>Име</th>
                <th>Фирма</th>
                <th>Email</th>
                <th>Телефон</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="4" className="au-table-empty">
                    Няма намерени потребители.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() =>
                      navigate(`/admin/edit-global-user/${user.id}`)
                    }
                  >
                    <td className="au-table-name-cell">
                      {user.first_name} {user.second_name} {user.last_name}
                    </td>
                    <td>{user.company_name || "-"}</td>
                    <td>{user.email || "-"}</td>
                    <td>{user.phone || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="au-mobile-list mobile-view">
            {users.map((user) => (
              <div
                key={user.id}
                className="au-mobile-card"
                onClick={() => navigate(`/admin/edit-global-user/${user.id}`)}
              >
                <div className="au-card-header">
                  <span className="au-card-title">
                    {user.first_name} {user.second_name} {user.last_name}
                  </span>
                  <User
                    size={20}
                    strokeWidth={2.5}
                    className="au-card-user-icon"
                  />
                </div>
                {user.company_name && (
                  <div className="au-card-subtitle">
                    <Building2 size={16} strokeWidth={2.5} />{" "}
                    {user.company_name}
                  </div>
                )}
                <div className="au-card-subtitle">
                  <Mail size={16} strokeWidth={2.5} /> {user.email || "-"}
                </div>
                <div className="au-card-subtitle">
                  <Phone size={16} strokeWidth={2.5} /> {user.phone || "-"}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="au-pagination">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft size={16} strokeWidth={2.5} /> Предишна
              </button>
              <span>
                Страница {page} от {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Следваща <ChevronRight size={16} strokeWidth={2.5} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default GlobalUsers;
