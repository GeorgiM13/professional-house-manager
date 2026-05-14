import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { useTheme } from "../../components/ThemeContext";
import {
  Building2,
  CalendarDays,
  User,
  AlertCircle,
  Loader2,
  X,
  Calculator,
  Edit,
  CreditCard,
  RotateCcw,
} from "lucide-react";
import "./styles/FeeDetails.css";

const EXCHANGE_RATE = 1.95583;

function FeeDetails({
  isOpen,
  onClose,
  feeId,
  onEditFeeClick,
  onPayCurrent,
  onPayAll,
  onRevertPayment,
}) {
  const { isDarkMode } = useTheme();
  const [fee, setFee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !feeId) {
      setFee(null);
      return;
    }

    let isMounted = true;
    setLoading(true);

    async function fetchFeeDetails() {
      const { data: feeData, error: feeError } = await supabase
        .from("fees")
        .select(
          `
          *,
          users (id, first_name, last_name, company_name),
          buildings (id, name, address)
        `,
        )
        .eq("id", feeId)
        .single();

      if (feeError) {
        console.error("Грешка при извличане на такса:", feeError);
        if (isMounted) setLoading(false);
        return;
      }

      if (isMounted) {
        setFee(feeData);
        setLoading(false);
      }
    }

    fetchFeeDetails();

    return () => {
      isMounted = false;
    };
  }, [isOpen, feeId]);

  const formatDualCurrency = (amount, year) => {
    const numericAmount = Number(amount) || 0;
    let eurValue, bgnValue;
    if (Number(year) < 2026) {
      bgnValue = numericAmount;
      eurValue = numericAmount / EXCHANGE_RATE;
    } else {
      eurValue = numericAmount;
      bgnValue = numericAmount * EXCHANGE_RATE;
    }
    return `${eurValue.toFixed(2)} € / ${bgnValue.toFixed(2)} лв.`;
  };

  const getStatusClass = (paid, currentDue) => {
    const isPaidCurrent = Number(paid || 0) >= Number(currentDue || 0) - 0.01;
    return isPaidCurrent ? "adm-feed-status-paid" : "adm-feed-status-unpaid";
  };

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains("adm-feed-modal-overlay")) onClose();
  };

  const getMonthNameBG = (monthNum) => {
    if (!monthNum) return "";
    const date = new Date(2000, monthNum - 1, 1);
    const monthStr = date.toLocaleString("bg-BG", { month: "long" });
    return monthStr.charAt(0).toUpperCase() + monthStr.slice(1);
  };

  if (!isOpen) return null;

  const isPaidCurrent = fee
    ? Number(fee.paid || 0) >= Number(fee.current_month_due || 0) - 0.01
    : false;

  const feeComponents = fee
    ? [
        { label: "Такса Управление", value: fee.management_fee },
        { label: "Хигиенист", value: fee.cleaner },
        { label: "Консумативи за чистене", value: fee.cleaning_materials },
        { label: "Фонд Ремонт", value: fee.repair_fund },
        { label: "Извънредни ремонти", value: fee.repairs },
        { label: "Абонамент асансьор", value: fee.fee_lift },
        { label: "Инспекция асансьор", value: fee.elevator_inspection },
        { label: "Ток асансьор (общо)", value: fee.electricity_lift },
        {
          label: "Ток асансьор (апартаменти)",
          value: fee.electricity_elevator_apartments,
        },
        {
          label: "Ток асансьор (офиси)",
          value: fee.electricity_elevator_offices,
        },
        { label: "Ток стълбище (общо)", value: fee.electricity_light },
        {
          label: "Ток стълбище (апартаменти)",
          value: fee.electricity_staircase_apartments,
        },
        {
          label: "Ток стълбище (офиси)",
          value: fee.electricity_staircase_offices,
        },
        { label: "Ток гаражи", value: fee.electricity_garages },
        { label: "Ток вентилация", value: fee.electricity_ventilation },
        { label: "Обща вода", value: fee.water_common },
        { label: "Дезинсекция", value: fee.disinsection },
        { label: "Осветление (консумативи)", value: fee.lighting_supplies },
        { label: "Интернет", value: fee.internet },
        { label: "Видеонаблюдение", value: fee.video_surveillance },
        { label: "Контрол на достъпа", value: fee.access_control },
      ].filter((item) => Number(item.value || 0) > 0)
    : [];

  return (
    <div
      className={`adm-feed-modal-overlay ${isDarkMode ? "adm-feed-dark" : "adm-feed-light"}`}
      onClick={handleOverlayClick}
    >
      <div className="adm-feed-modal-content fade-in">
        {loading ? (
          <div className="adm-feed-loading adm-feed-flex-col adm-feed-flex-center">
            <Loader2
              size={40}
              strokeWidth={2.5}
              className="adm-feed-spinner-icon"
            />
            <p>Зареждане на детайли...</p>
          </div>
        ) : !fee ? (
          <div className="adm-feed-error adm-feed-flex-col adm-feed-flex-center">
            <AlertCircle size={48} strokeWidth={2} />
            <p>Таксата не е намерена.</p>
            <button className="adm-feed-close-btn-error" onClick={onClose}>
              Затвори
            </button>
          </div>
        ) : (
          <>
            <div className="adm-feed-card-header">
              <div className="adm-feed-header-top adm-feed-flex-align-between">
                <div
                  className={`adm-feed-status-pill ${getStatusClass(fee.paid, fee.current_month_due)}`}
                >
                  {isPaidCurrent ? "ПЛАТЕНО" : "НЕПЛАТЕНО"}
                </div>
                <button
                  className="adm-feed-close-btn"
                  onClick={onClose}
                  title="Затвори"
                >
                  <X size={24} strokeWidth={2.5} />
                </button>
              </div>

              <div className="adm-feed-title-section">
                <h1 className="adm-feed-title">
                  {fee.type} {fee.object_number}
                </h1>
              </div>

              <div className="adm-feed-location-badge adm-feed-flex-align">
                <div className="adm-feed-icon-wrapper">
                  <Building2 size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h3>{fee.buildings?.name || "Неизвестна сграда"}</h3>
                  <small>
                    Период: {getMonthNameBG(fee.month)} {fee.year} г.
                  </small>
                </div>
              </div>
            </div>

            <div className="adm-feed-divider"></div>

            <div className="adm-feed-body">
              <div
                className="adm-feed-meta-grid"
                style={{ marginBottom: "1.5rem" }}
              >
                <div className="adm-feed-meta-box">
                  <div className="adm-feed-meta-icon">
                    <User size={20} strokeWidth={2.5} />
                  </div>
                  <div className="adm-feed-meta-info">
                    <span className="adm-feed-meta-label">Клиент</span>
                    <span className="adm-feed-meta-value">
                      {fee.users
                        ? fee.users.company_name ||
                          `${fee.users.first_name} ${fee.users.last_name}`
                        : "Не е посочен"}
                    </span>
                  </div>
                </div>
                <div className="adm-feed-meta-box">
                  <div className="adm-feed-meta-icon">
                    <CalendarDays size={20} strokeWidth={2.5} />
                  </div>
                  <div className="adm-feed-meta-info">
                    <span className="adm-feed-meta-label">Етаж</span>
                    <span className="adm-feed-meta-value">
                      {fee.floor || "-"}
                    </span>
                  </div>
                </div>
              </div>

              {Number(fee.previous_debt || 0) > 0 && (
                <div className="adm-feed-debt-banner adm-feed-flex-align">
                  <AlertCircle size={24} strokeWidth={2.5} />
                  <div>
                    <div className="adm-feed-debt-label">
                      Натрупани стари задължения:
                    </div>
                    <div className="adm-feed-debt-value">
                      {formatDualCurrency(fee.previous_debt, fee.year)}
                    </div>
                  </div>
                </div>
              )}

              <div className="adm-feed-section">
                <span className="adm-feed-section-label adm-feed-flex-align">
                  <Calculator size={16} strokeWidth={2.5} /> Детайлна разбивка
                  за месеца
                </span>

                <div className="adm-feed-math-box">
                  {feeComponents.length > 0 ? (
                    feeComponents.map((comp, idx) => (
                      <div key={idx} className="math-row">
                        <span>{comp.label}:</span>
                        <span>{formatDualCurrency(comp.value, fee.year)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="math-row">
                      <span style={{ fontStyle: "italic", opacity: 0.7 }}>
                        Няма начислени компоненти
                      </span>
                    </div>
                  )}

                  {Number(fee.rounding_remainder || 0) > 0 && (
                    <div className="math-row rounding">
                      <span>Закръгляне (Остатък към каса):</span>
                      <span>
                        + {formatDualCurrency(fee.rounding_remainder, fee.year)}
                      </span>
                    </div>
                  )}
                  <div className="math-divider"></div>
                  <div className="math-row total">
                    <span>Текуща такса за месеца:</span>
                    <span>
                      {formatDualCurrency(fee.current_month_due, fee.year)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="adm-feed-section" style={{ marginTop: "2rem" }}>
                <div className="adm-feed-mobile-actions">
                  {!isPaidCurrent && (
                    <button
                      className="adm-feed-btn adm-feed-btn-primary adm-feed-flex-align adm-feed-flex-center"
                      onClick={onPayCurrent}
                      style={{ padding: "12px", fontSize: "1rem" }}
                    >
                      <CreditCard size={18} /> Плати текущо
                    </button>
                  )}
                  {Number(fee.total_due || 0) > Number(fee.paid || 0) && (
                    <button
                      className="adm-feed-btn adm-feed-btn-primary adm-feed-flex-align adm-feed-flex-center"
                      onClick={onPayAll}
                      style={{
                        padding: "12px",
                        fontSize: "1rem",
                        backgroundColor: "var(--green-text)",
                        borderColor: "var(--green-text)",
                      }}
                    >
                      <CreditCard size={18} /> Плати всичко
                    </button>
                  )}
                </div>

                <div
                  className="adm-feed-global-actions"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  <button
                    className="adm-feed-btn adm-feed-btn-outline adm-feed-flex-align adm-feed-flex-center"
                    onClick={() => {
                      onClose();
                      if (onEditFeeClick) onEditFeeClick(fee);
                    }}
                    style={{ width: "100%", padding: "12px", fontSize: "1rem" }}
                  >
                    <Edit size={18} /> Редактирай таксата
                  </button>

                  {Number(fee.paid || 0) > 0 && (
                    <button
                      className="adm-feed-btn adm-feed-btn-secondary adm-feed-flex-align adm-feed-flex-center"
                      onClick={onRevertPayment}
                      style={{
                        width: "100%",
                        padding: "12px",
                        fontSize: "1rem",
                        color: "var(--red-text)",
                        borderColor: "rgba(220, 38, 38, 0.3)",
                      }}
                    >
                      <RotateCcw size={18} /> Маркирай като неплатено
                    </button>
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

export default FeeDetails;
