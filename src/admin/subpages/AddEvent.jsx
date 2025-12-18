import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import Swal from "sweetalert2";
import DatePicker, { registerLocale } from "react-datepicker";
import bg from "date-fns/locale/bg";
import "react-datepicker/dist/react-datepicker.css";
import { supabase } from "../../supabaseClient";
import { useTheme } from "../../components/ThemeContext";
import { useUserBuildings } from "../hooks/UseUserBuildings";
import { useLocalUser } from "../hooks/UseLocalUser";

import "./styles/AddEvent.css";

registerLocale("bg", bg);

const STATUS_OPTIONS = [
  { value: "ново", label: "🔵 Ново", color: "#3b82f6" },
  { value: "изпълнено", label: "🟢 Изпълнено", color: "#22c55e" },
];

function AddEvent() {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  const { user: currentUser } = useLocalUser();
  const { buildings, loading: loadingBuildings } = useUserBuildings(
    currentUser?.id
  );

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [newEvent, setNewEvent] = useState({
    status: "ново",
    subject: "",
    description: "",
    completion_date: null,
    assigned_to: "",
    building_id: "",
  });

  useEffect(() => {
    async function fetchUsers() {
      const { data } = await supabase
        .from("users")
        .select("id, first_name, last_name, role")
        .or("role.eq.admin,role.eq.manager");

      setUsers(data || []);
    }
    fetchUsers();
  }, []);

  const buildingOptions = useMemo(() => {
    return buildings.map((b) => ({
      value: b.id,
      label: `${b.name}, ${b.address}`,
    }));
  }, [buildings]);

  const assignedOptions = useMemo(() => {
    return users.map((u) => ({
      value: u.id,
      label: `${u.first_name} ${u.last_name}`,
    }));
  }, [users]);

  const getSelectValue = (options, value) => {
    return options.find((option) => option.value === value) || null;
  };

  const selectStyles = {
    container: (base) => ({
      ...base,
      width: "100%",
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    control: (base, state) => ({
      ...base,
      background: isDarkMode ? "#0f172a" : "#f8fafc",
      borderColor: state.isFocused
        ? "var(--au-primary)"
        : isDarkMode
        ? "#334155"
        : "#cbd5e1",
      color: isDarkMode ? "#f1f5f9" : "#1e293b",
      minHeight: "42px",
      borderRadius: "8px",
      boxShadow: state.isFocused ? "0 0 0 3px rgba(59, 130, 246, 0.1)" : "none",
    }),
    menu: (base) => ({
      ...base,
      background: isDarkMode ? "#1e293b" : "white",
      zIndex: 9999,
      border: "1px solid var(--au-border)",
    }),
    option: (base, state) => {
      if (state.isSelected)
        return {
          ...base,
          backgroundColor: "#3b82f6",
          color: "white",
          cursor: "pointer",
        };
      if (state.isFocused)
        return {
          ...base,
          backgroundColor: isDarkMode ? "#334155" : "#eff6ff",
          color: isDarkMode ? "#f1f5f9" : "#1e293b",
          cursor: "pointer",
        };
      return {
        ...base,
        backgroundColor: "transparent",
        color: isDarkMode ? "#f1f5f9" : "#1e293b",
        cursor: "pointer",
      };
    },
    singleValue: (base) => ({
      ...base,
      color: isDarkMode ? "#f1f5f9" : "#1e293b",
    }),
    input: (base) => ({ ...base, color: isDarkMode ? "#f1f5f9" : "#1e293b" }),
    placeholder: (base) => ({ ...base, color: "var(--au-text-sec)" }),
  };

  const handleChange = (name, value) => {
    setNewEvent((prev) => ({ ...prev, [name]: value }));
  };

  const toLocalISOString = (date) => {
    if (!date) return null;
    const tzOffset = date.getTimezoneOffset() * 60000;
    const localISOTime = new Date(date.getTime() - tzOffset)
      .toISOString()
      .slice(0, -1);
    return localISOTime;
  };

  const handleCreateEvent = async () => {
    if (!newEvent.subject || !newEvent.building_id) {
      Swal.fire({
        icon: "warning",
        title: "Липсват данни",
        text: "Моля попълнете Относно и Сграда.",
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...newEvent,
        completion_date: toLocalISOString(newEvent.completion_date),
      };

      const { error } = await supabase.from("events").insert([payload]);
      if (error) throw error;

      await Swal.fire({
        icon: "success",
        title: "Успех!",
        text: "Събитието е добавено успешно.",
        timer: 1500,
        showConfirmButton: false,
      });
      navigate("/admin/adminevents");
    } catch (err) {
      Swal.fire({ icon: "error", title: "Грешка", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => navigate("/admin/adminevents");

  return (
    <div className={`adev-container ${isDarkMode ? "au-dark" : "au-light"}`}>
      <div className="adev-header">
        <div>
          <h1>Добавяне на събитие</h1>
          <p>Планиране на нова задача или среща</p>
        </div>
        <button className="adev-btn adev-btn-secondary" onClick={goBack}>
          Назад
        </button>
      </div>

      <div className="adev-grid">
        <div className="adev-card">
          <div className="adev-section-title">📝 Описание на задачата</div>

          <div className="adev-form-group">
            <label>Относно *</label>
            <input
              className="adev-input"
              value={newEvent.subject}
              onChange={(e) => handleChange("subject", e.target.value)}
              placeholder="Напр. Общо събрание"
            />
          </div>

          <div className="adev-form-group">
            <label>Описание</label>
            <textarea
              className="adev-textarea"
              value={newEvent.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Детайли за събитието..."
            />
          </div>
        </div>

        <div className="adev-card" style={{ height: "fit-content" }}>
          <div className="adev-section-title">⚙️ Детайли за изпълнение</div>

          <div className="adev-form-group">
            <label>Сграда *</label>
            <Select
              options={buildingOptions}
              value={getSelectValue(buildingOptions, newEvent.building_id)}
              isLoading={loadingBuildings}
              onChange={(opt) => handleChange("building_id", opt?.value)}
              placeholder="Избери сграда..."
              styles={selectStyles}
              noOptionsMessage={() => "Няма намерени"}
              menuPortalTarget={document.body}
            />
          </div>

          <div className="adev-form-group" style={{ marginTop: "1rem" }}>
            <label>Статус</label>
            <Select
              options={STATUS_OPTIONS}
              value={getSelectValue(STATUS_OPTIONS, newEvent.status)}
              onChange={(opt) => handleChange("status", opt?.value)}
              styles={selectStyles}
              isSearchable={false}
            />
          </div>

          <div className="adev-form-group" style={{ marginTop: "1rem" }}>
            <label>Дата и час на изпълнение</label>
            <div className="custom-datepicker-wrapper">
              <span className="calendar-icon">📅</span>
              <DatePicker
                selected={newEvent.completion_date}
                onChange={(date) => handleChange("completion_date", date)}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                timeCaption="Час"
                dateFormat="dd MMMM yyyy, HH:mm"
                placeholderText="Изберете дата и час..."
                className="adev-input date-input-field"
                wrapperClassName="w-full-datepicker"
                locale="bg"
                autoComplete="off"
                isClearable
                onFocus={(e) => e.target.blur()}
              />
            </div>
          </div>

          <div className="adev-form-group" style={{ marginTop: "1rem" }}>
            <label>Възложено на</label>
            <Select
              options={assignedOptions}
              value={getSelectValue(assignedOptions, newEvent.assigned_to)}
              onChange={(opt) => handleChange("assigned_to", opt?.value)}
              placeholder="Избери служител..."
              styles={selectStyles}
              isSearchable={false}
            />
          </div>
        </div>
      </div>

      <div className="adev-actions">
        <button
          className="adev-btn adev-btn-secondary"
          onClick={goBack}
          disabled={loading}
        >
          Отказ
        </button>
        <button
          className="adev-btn adev-btn-primary"
          onClick={handleCreateEvent}
          disabled={loading}
        >
          {loading ? "Запазване..." : "Създай събитие"}
        </button>
      </div>
    </div>
  );
}

export default AddEvent;