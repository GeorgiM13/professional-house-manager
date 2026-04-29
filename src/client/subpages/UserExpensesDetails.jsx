import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { useTheme } from "../../components/ThemeContext";
import {
  X,
  Building2,
  AlignLeft,
  Loader2,
  AlertCircle,
  Zap,
  ArrowUpDown,
  Droplets,
  Sparkles,
  Wrench,
  Briefcase,
  Lightbulb,
  ClipboardCheck,
  Wifi,
  Key,
  Bug,
  Package,
  CheckCircle,
  Clock,
} from "lucide-react";
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

const getExpenseIcon = (type, size = 28) => {
  if (!type) return <Package size={size} strokeWidth={2.5} />;
  const t = type.toLowerCase();
  if (t.includes("electricity") || t.includes("tok"))
    return <Zap size={size} strokeWidth={2.5} />;
  if (t.includes("lift") || t.includes("asansyor"))
    return <ArrowUpDown size={size} strokeWidth={2.5} />;
  if (t.includes("water")) return <Droplets size={size} strokeWidth={2.5} />;
  if (t.includes("clean") || t.includes("хигиенист"))
    return <Sparkles size={size} strokeWidth={2.5} />;
  if (t.includes("repair")) return <Wrench size={size} strokeWidth={2.5} />;
  if (t.includes("manager")) return <Briefcase size={size} strokeWidth={2.5} />;
  if (t.includes("lighting"))
    return <Lightbulb size={size} strokeWidth={2.5} />;
  if (t.includes("review"))
    return <ClipboardCheck size={size} strokeWidth={2.5} />;
  if (t.includes("internet") || t.includes("video"))
    return <Wifi size={size} strokeWidth={2.5} />;
  if (t.includes("access") || t.includes("chip"))
    return <Key size={size} strokeWidth={2.5} />;
  if (t.includes("pest") || t.includes("дезинсекция"))
    return <Bug size={size} strokeWidth={2.5} />;
  return <Package size={size} strokeWidth={2.5} />;
};

function UserExpenseDetails({ expenseId, isOpen, onClose }) {
  const { isDarkMode } = useTheme();
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchExpense() {
      if (!isOpen || !expenseId) return;

      setLoading(true);
      setExpense(null);

      const { data, error } = await supabase
        .from("expenses")
        .select(
          `
            id, type, month, year, current_month, paid, notes, created_at,
            building_id, building:building_id(name,address)
        `,
        )
        .eq("id", expenseId)
        .single();

      if (error) {
        console.error("Supabase error:", error);
      } else {
        setExpense(data);
      }
      setLoading(false);
    }
    fetchExpense();
  }, [expenseId, isOpen]);

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains("uexd-modal-overlay")) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const isPaid = expense
    ? String(expense.paid).toLowerCase() === "true" ||
      expense.paid === true ||
      String(expense.paid).toLowerCase() === "да"
    : false;

  return (
    <div
      className={`uexd-modal-overlay ${isDarkMode ? "client-dark" : "client-light"}`}
      onClick={handleOverlayClick}
    >
      <div className="uexd-modal-content fade-in">
        {loading ? (
          <div className="uexd-loading uexd-flex-col uexd-flex-center">
            <Loader2
              size={40}
              strokeWidth={2.5}
              className="uexd-spinner-icon"
            />
            <p>Зареждане на детайли...</p>
          </div>
        ) : !expense ? (
          <div className="uexd-error uexd-flex-col uexd-flex-center">
            <AlertCircle size={48} strokeWidth={2} />
            <p>Разходът не е намерен.</p>
            <button className="uexd-close-btn-error" onClick={onClose}>
              Затвори
            </button>
          </div>
        ) : (
          <>
            <div className="uexd-card-header">
              <div className="uexd-header-top uexd-flex-align">
                <div
                  className={`uexd-status-pill uexd-flex-align ${isPaid ? "uexd-paid" : "uexd-unpaid"}`}
                >
                  {isPaid ? (
                    <>
                      <CheckCircle size={16} strokeWidth={3} /> Платено
                    </>
                  ) : (
                    <>
                      <Clock size={16} strokeWidth={3} /> Неплатено
                    </>
                  )}
                </div>
                <button
                  className="uexd-close-btn"
                  onClick={onClose}
                  title="Затвори"
                >
                  <X size={24} strokeWidth={2.5} />
                </button>
              </div>

              <div className="uexd-title-section uexd-flex-align">
                <div className="uexd-type-icon uexd-flex-center">
                  {getExpenseIcon(expense.type)}
                </div>
                <h1 className="uexd-title">
                  {EXPENSE_TYPES[expense.type] || expense.type}
                </h1>
              </div>

              <div className="uexd-location-badge uexd-flex-align">
                <div className="uexd-icon-wrapper">
                  <Building2 size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h3>{expense.building?.name || "Неизвестна сграда"}</h3>
                  <small>{expense.building?.address || "Няма адрес"}</small>
                </div>
              </div>
            </div>

            <div className="uexd-divider"></div>
            <div className="uexd-body">
              <div className="uexd-summary-grid">
                <div className="uexd-summary-box">
                  <span className="label">Сума</span>
                  <span className="value">
                    {Number(expense.current_month).toFixed(2)}{" "}
                    <small>лв.</small>
                  </span>
                </div>
                <div className="uexd-summary-box">
                  <span className="label">Период</span>
                  <span className="value period">
                    {MONTH_NAMES[expense.month]} {expense.year}
                  </span>
                </div>
              </div>

              <div className="uexd-description-container">
                <span className="uexd-section-label uexd-flex-align">
                  <AlignLeft size={16} strokeWidth={2.5} /> Допълнителни бележки
                </span>
                <div className="uexd-description-content">
                  {expense.notes ? (
                    expense.notes
                  ) : (
                    <em className="text-muted">
                      Няма въведени бележки към този разход.
                    </em>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default UserExpenseDetails;
