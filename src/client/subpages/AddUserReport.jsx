import { useState, useEffect, useMemo } from "react";
import { supabase } from "../../supabaseClient";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import { useUserBuildings } from "../hooks/useUserBuildings";
import { useLocalUser } from "../hooks/useLocalUser";
import { useTheme } from "../../components/ThemeContext";
import "./styles/AddUserReport.css";

const CUSTOM_SELECT_STYLES = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: "var(--uar-bg-input)",
    borderColor: state.isFocused ? "var(--uar-primary)" : "var(--uar-border)",
    borderRadius: "8px",
    color: "var(--uar-text-main)",
    boxShadow: state.isFocused ? "0 0 0 2px var(--uar-primary-light)" : "none",
    minHeight: "44px",
  }),
  menu: (provided) => ({
    ...provided,
    zIndex: 9999,
    backgroundColor: "var(--uar-bg-card)",
    border: "1px solid var(--uar-border)",
  }),
  singleValue: (provided) => ({ ...provided, color: "var(--uar-text-main)" }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "var(--uar-primary)"
      : state.isFocused
      ? "var(--uar-bg-hover)"
      : "transparent",
    color: state.isSelected ? "white" : "var(--uar-text-main)",
    cursor: "pointer",
  }),
  placeholder: (provided) => ({
    ...provided,
    color: "var(--uar-text-placeholder)",
  }),
  input: (provided) => ({ ...provided, color: "var(--uar-text-main)" }),
};

function AddUserReport() {
  const navigate = useNavigate();
  const { userId } = useLocalUser();
  const { isDarkMode } = useTheme();

  const { buildings, loading: loadingBuildings } = useUserBuildings(userId);

  const [selectedBuilding, setSelectedBuilding] = useState("all");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const buildingOptions = useMemo(
    () =>
      buildings.map((b) => ({ value: b.id, label: `${b.name}, ${b.address}` })),
    [buildings]
  );

  useEffect(() => {
    if (!loadingBuildings && buildings.length === 1) {
      setSelectedBuilding(buildings[0].id);
    }
  }, [buildings, loadingBuildings]);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!subject.trim() || !description.trim()) {
      setMessage({ text: "Моля, попълнете всички полета.", type: "error" });
      return;
    }
    if (selectedBuilding === "all" || !selectedBuilding) {
      setMessage({ text: "Моля, изберете сграда.", type: "error" });
      return;
    }

    setLoadingSubmit(true);
    setMessage({ text: "", type: "" });

    try {
      const { error } = await supabase.from("reports").insert([
        {
          status: "ново",
          subject,
          description,
          notes: "",
          submitted_by: userId,
          building_id: selectedBuilding,
        },
      ]);

      if (error) throw error;

      setMessage({
        text: "Сигналът е подаден успешно! Пренасочване...",
        type: "success",
      });
      setSubject("");
      setDescription("");

      setTimeout(() => navigate("/client/reports"), 1500);
    } catch (error) {
      console.error("Error submitting report:", error);
      setMessage({
        text: "Грешка при подаване на сигнал. Моля опитайте отново.",
        type: "error",
      });
    } finally {
      setLoadingSubmit(false);
    }
  }

  const getCurrentOption = () =>
    buildingOptions.find((opt) => opt.value === selectedBuilding);

  return (
    <div
      className={`uar-wrapper ${isDarkMode ? "client-dark" : "client-light"}`}
    >
      <div className="uar-container fade-in">
        <div className="uar-header">
          <button className="uar-back-btn" onClick={() => navigate(-1)}>
            ← Назад
          </button>
          <h1>Подай нов сигнал</h1>
          <p className="uar-subtitle">Опишете проблема възможно най-детайлно</p>
        </div>

        <form className="uar-card" onSubmit={handleSubmit}>
          <div className="uar-form-group">
            <label>Вашата сграда</label>
            {loadingBuildings ? (
              <div className="uar-loading-field">Зареждане на сгради...</div>
            ) : buildings.length === 1 ? (
              <input
                type="text"
                value={`${buildings[0].name} – ${buildings[0].address}`}
                readOnly
                className="uar-input uar-readonly"
              />
            ) : (
              <Select
                options={buildingOptions}
                value={getCurrentOption()}
                onChange={(opt) => setSelectedBuilding(opt ? opt.value : "all")}
                styles={CUSTOM_SELECT_STYLES}
                placeholder="Изберете сграда..."
                isSearchable={true}
              />
            )}
          </div>

          <div className="uar-form-group">
            <label>Относно (Тема)</label>
            <input
              type="text"
              className="uar-input"
              placeholder="Напр. Повреда в осветлението"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={loadingSubmit}
            />
          </div>

          <div className="uar-form-group">
            <label>Описание на проблема</label>
            <textarea
              className="uar-textarea"
              placeholder="Моля, опишете подробно ситуацията..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loadingSubmit}
            />
          </div>

          {message.text && (
            <div className={`uar-message ${message.type}`}>{message.text}</div>
          )}

          <div className="uar-actions">
            <button
              type="button"
              className="uar-btn-cancel"
              onClick={() => navigate(-1)}
            >
              Отказ
            </button>
            <button
              type="submit"
              className="uar-btn-submit"
              disabled={loadingSubmit || loadingBuildings}
            >
              {loadingSubmit ? (
                <>
                  <span className="uar-spinner-sm"></span> Изпращане...
                </>
              ) : (
                "🚀 Подай сигнал"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddUserReport;
