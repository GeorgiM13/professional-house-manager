import { useState, useEffect, useMemo } from "react";
import { supabase } from "../../supabaseClient";
import Select from "react-select";
import { useUserBuildings } from "../hooks/useUserBuildings";
import { useLocalUser } from "../hooks/useLocalUser";
import { useTheme } from "../../components/ThemeContext";
import { X, Send, Building, Loader2 } from "lucide-react";
import "./styles/AddUserReport.css";

function AddUserReport({ isOpen, onClose, onSuccess }) {
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
      buildings.map((b) => ({
        value: b.id,
        label: [b.name, b.address].filter(Boolean).join(", "),
      })),
    [buildings],
  );

  useEffect(() => {
    if (isOpen) {
      setSubject("");
      setDescription("");
      setMessage({ text: "", type: "" });
      if (!loadingBuildings && buildings.length === 1) {
        setSelectedBuilding(buildings[0].id);
      } else {
        setSelectedBuilding("all");
      }
    }
  }, [isOpen, buildings, loadingBuildings]);

  const customFormatOptionLabel = ({ label }, { context }) => {
    const shouldShowIcon = context === "value";
    const cleanLabel =
      typeof label === "string" ? label.replace(/^[,\s]+/, "") : label;

    return (
      <div className="flex-align">
        {shouldShowIcon && (
          <Building size={16} strokeWidth={2.5} className="uar-select-icon" />
        )}
        <span>{cleanLabel}</span>
      </div>
    );
  };

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
        text: "Сигналът е подаден успешно!",
        type: "success",
      });

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
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
    buildingOptions.find((opt) => opt.value === selectedBuilding) || null;

  if (!isOpen) return null;

  return (
    <div
      className={`uar-overlay ${isDarkMode ? "client-dark" : "client-light"}`}
    >
      <div className="uar-modal fade-in">
        <div className="uar-header">
          <h2>Подай нов сигнал</h2>
          <p className="uar-subtitle">Опишете проблема възможно най-детайлно</p>
          <button
            className="uar-close-btn flex-align"
            onClick={onClose}
            disabled={loadingSubmit}
          >
            <X size={24} strokeWidth={2.5} />
          </button>
        </div>

        <form className="uar-form" onSubmit={handleSubmit}>
          <div className="uar-form-group">
            <label>Вашата сграда</label>
            {loadingBuildings ? (
              <div className="uar-loading-field flex-align">
                <Loader2
                  size={16}
                  strokeWidth={2.5}
                  className="uar-spinner-icon"
                />{" "}
                Зареждане на сгради...
              </div>
            ) : buildings.length === 1 ? (
              <div className="uar-input uar-readonly flex-align">
                <Building
                  size={16}
                  strokeWidth={2.5}
                  className="uar-select-icon"
                />
                <span>{buildings[0].name}</span>
              </div>
            ) : (
              <Select
                options={buildingOptions}
                value={getCurrentOption()}
                onChange={(opt) => setSelectedBuilding(opt ? opt.value : "all")}
                formatOptionLabel={customFormatOptionLabel}
                placeholder="Изберете сграда..."
                isSearchable={true}
                className="react-select-container"
                classNamePrefix="react-select"
                isDisabled={loadingSubmit}
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
              className="uar-btn-cancel flex-align"
              onClick={onClose}
              disabled={loadingSubmit}
            >
              Отказ
            </button>
            <button
              type="submit"
              className="uar-btn-submit flex-align"
              disabled={loadingSubmit || loadingBuildings}
            >
              {loadingSubmit ? (
                <>
                  <Loader2
                    size={18}
                    strokeWidth={2.5}
                    className="uar-spinner-icon"
                  />{" "}
                  Изпращане...
                </>
              ) : (
                <>
                  <Send size={18} strokeWidth={2.5} /> Подай сигнал
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddUserReport;
