import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { useTheme } from "../../components/ThemeContext";
import "./styles/UserExpensesDetails.css";

const MONTH_NAMES = {
  1: "Януари",
  2: "Февруари",
  3: "Март",
  4: "Април",
  5: "Май",
  6: "Юни",
  7: "Юли",
  8: "Август",
  9: "Септември",
  10: "Октомври",
  11: "Ноември",
  12: "Декември",
};

const EXPENSE_TYPES = {
  electricity_lift: "Ток асансьор",
  fee_lift: "Сервиз асансьор",
  electricity_light: "Ток осветление",
  cleaner: "Хигиенист",
  repair: "Ремонт",
  manager: "Домоуправител",
  water_building: "Вода обща",
  lighting: "Осветление",
  cleaning_supplies: "Консумативи за почистване",
  fee_annual_review: "Годишен преглед асансьор",
  internet_video: "Интернет/Видеонаблюдение",
  access_control: "Контрол на достъп",
  pest_control: "Дезинсекция",
  other: "Други",
};

const getExpenseIcon = (type) => {
  if (!type) return "📝";
  const t = type.toLowerCase();
  if (t.includes("electricity") || t.includes("tok")) return "⚡";
  if (t.includes("lift") || t.includes("asansyor")) return "🛗";
  if (t.includes("water")) return "💧";
  if (t.includes("clean")) return "🧹";
  if (t.includes("repair")) return "🛠️";
  if (t.includes("manager")) return "👨‍💼";
  if (t.includes("lighting")) return "💡";
  if (t.includes("review")) return "📋";
  if (t.includes("internet") || t.includes("video")) return "📡";
  if (t.includes("access") || t.includes("chip")) return "🔑";
  if (t.includes("pest") || t.includes("дезинсекция")) return "🕷️";
  return "📦";
};

function UserExpenseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchExpense() {
      const { data, error } = await supabase
        .from("expenses")
        .select(
          `
            id, type, month, year, current_month, paid, notes, created_at,
            building_id, building:building_id(name,address)
        `
        )
        .eq("id", id)
        .single();

      if (error) {
        console.error("Supabase error:", error);
      } else {
        setExpense(data);
      }
      setLoading(false);
    }
    fetchExpense();
  }, [id]);

  if (loading)
    return (
      <div
        className={`uexd-wrapper ${
          isDarkMode ? "client-dark" : "client-light"
        }`}
      >
        <div className="uexd-loading">
          <div className="uexd-spinner"></div>
          <p>Зареждане на детайли...</p>
        </div>
      </div>
    );

  if (!expense)
    return (
      <div
        className={`uexd-wrapper ${
          isDarkMode ? "client-dark" : "client-light"
        }`}
      >
        <div className="uexd-error">Разходът не е намерен.</div>
      </div>
    );

  const isPaid =
    String(expense.paid).toLowerCase() === "true" ||
    expense.paid === true ||
    String(expense.paid).toLowerCase() === "да";

  return (
    <div
      className={`uexd-wrapper ${isDarkMode ? "client-dark" : "client-light"}`}
    >
      <div className="uexd-page-header">
        <button
          className="uexd-back-link"
          onClick={() => navigate("/client/expenses")}
        >
          ← Назад към списъка
        </button>
        <div
          className={`uexd-status-pill ${isPaid ? "uexd-paid" : "uexd-unpaid"}`}
        >
          {isPaid ? "✅ ПЛАТЕНО" : "⏳ НЕПЛАТЕНО"}
        </div>
      </div>

      <div className="uexd-main-card fade-in">
        <div className="uexd-card-header">
          <div className="uexd-location-badge">
            <span className="icon">🏢</span>
            <div>
              <h3>{expense.building?.name || "Неизвестна сграда"}</h3>
              <small>{expense.building?.address || "Няма адрес"}</small>
            </div>
          </div>
          <div className="uexd-period">
            <div className="period-item">
              <span>🗓️ Период:</span>
              <strong>
                {MONTH_NAMES[expense.month]} {expense.year}
              </strong>
            </div>
          </div>
        </div>

        <div className="uexd-divider"></div>

        <div className="uexd-body">
          <div className="uexd-type-section">
            <div className="uexd-type-icon">{getExpenseIcon(expense.type)}</div>
            <h1 className="uexd-title">
              {EXPENSE_TYPES[expense.type] || expense.type}
            </h1>
          </div>

          <div className="uexd-amount-display">
            <span className="label">Сума на разхода</span>
            <span className="value">
              {Number(expense.current_month).toFixed(2)} <small>лв.</small>
            </span>
          </div>

          <div className="uexd-description-container">
            <span className="uexd-section-label">Допълнителни бележки</span>
            <div className="uexd-description-content">
              {expense.notes || (
                <em className="text-muted">
                  Няма въведени бележки към този разход.
                </em>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserExpenseDetails;
