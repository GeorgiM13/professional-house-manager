import { useState, useEffect } from "react";
import Select from "react-select";
import { supabase } from "../../supabaseClient";
import { useTheme } from "../../components/ThemeContext";
import Swal from "sweetalert2";
import {
  X,
  Edit,
  Save,
  Loader2,
  AlertTriangle,
  Building2,
  User,
  Calculator,
  CheckCircle2,
  Zap,
  ArrowUpDown,
  Lightbulb,
  Sparkles,
  Wrench,
  UserCog,
  Droplet,
  Package,
  ClipboardCheck,
  Wifi,
  KeyRound,
  Bug,
  History,
} from "lucide-react";
import "./styles/EditFee.css";

function EditFee({ isOpen, onClose, fee, onSuccess }) {
  const { isDarkMode } = useTheme();

  const [selectedField, setSelectedField] = useState("repairs");
  const [amountInput, setAmountInput] = useState("");
  const [actionType, setActionType] = useState("add");
  const [scope, setScope] = useState("single");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const editableFields = [
    { value: "management_fee", label: "Домоуправител", icon: UserCog },
    { value: "cleaner", label: "Хигиенист", icon: Sparkles },
    {
      value: "cleaning_materials",
      label: "Консумативи за почистване",
      icon: Package,
    },
    { value: "repair_fund", label: "Фонд Ремонт", icon: Wrench },
    { value: "repairs", label: "Ремонт", icon: Wrench },
    { value: "fee_lift", label: "Сервиз асансьор", icon: ArrowUpDown },
    {
      value: "elevator_inspection",
      label: "Годишен преглед асансьор",
      icon: ClipboardCheck,
    },
    { value: "electricity_lift", label: "Ток асансьор", icon: Zap },
    { value: "electricity_light", label: "Ток осветление", icon: Lightbulb },
    { value: "electricity_ventilation", label: "Ток вентилация", icon: Zap },
    { value: "water_common", label: "Вода обща", icon: Droplet },
    { value: "disinsection", label: "Дезинсекция", icon: Bug },
    { value: "internet", label: "Интернет/Видео", icon: Wifi },
    { value: "access_control", label: "Контрол достъп", icon: KeyRound },
    { value: "previous_debt", label: "Стари задължения", icon: History },
  ];

  const feeComponents = fee
    ? [
        { label: "Домоуправител", value: fee.management_fee },
        { label: "Хигиенист", value: fee.cleaner },
        { label: "Консумативи за почистване", value: fee.cleaning_materials },
        { label: "Фонд Ремонт", value: fee.repair_fund },
        { label: "Ремонт", value: fee.repairs },
        { label: "Сервиз асансьор", value: fee.fee_lift },
        { label: "Годишен преглед асансьор", value: fee.elevator_inspection },
        { label: "Ток асансьор (общо)", value: fee.electricity_lift },
        {
          label: "Ток асансьор (апартаменти)",
          value: fee.electricity_elevator_apartments,
        },
        {
          label: "Ток асансьор (офиси)",
          value: fee.electricity_elevator_offices,
        },
        { label: "Ток осветление (общо)", value: fee.electricity_light },
        {
          label: "Ток осветление (апартаменти)",
          value: fee.electricity_staircase_apartments,
        },
        {
          label: "Ток осветление (офиси)",
          value: fee.electricity_staircase_offices,
        },
        { label: "Ток гаражи", value: fee.electricity_garages },
        { label: "Ток вентилация", value: fee.electricity_ventilation },
        { label: "Осветление (консумативи)", value: fee.lighting_supplies },
        { label: "Вода обща", value: fee.water_common },
        { label: "Дезинсекция", value: fee.disinsection },
        {
          label: "Интернет/Видео",
          value:
            Number(fee.internet || 0) + Number(fee.video_surveillance || 0),
        },
        { label: "Контрол достъп", value: fee.access_control },
      ].filter((item) => Number(item.value || 0) > 0)
    : [];

  useEffect(() => {
    if (isOpen) {
      setAmountInput("");
      setActionType("add");
      setScope("single");
      setSelectedField("repairs");
    }
  }, [isOpen]);

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains("edit-fee-overlay") && !isSubmitting) {
      onClose();
    }
  };

  const getMonthNameBG = (monthNum) => {
    if (!monthNum) return "";
    const date = new Date(2000, monthNum - 1, 1);
    const monthStr = date.toLocaleString("bg-BG", { month: "long" });
    return monthStr.charAt(0).toUpperCase() + monthStr.slice(1);
  };

  const formatEuro = (amount) => {
    return `${Number(amount || 0).toFixed(2)} €`;
  };

  const handleSubmit = async () => {
    const numericAmount = parseFloat(amountInput.replace(",", "."));

    if (isNaN(numericAmount)) {
      return Swal.fire({
        title: "Внимание",
        text: "Моля, въведете валидна сума.",
        icon: "warning",
        customClass: { container: "edit-fee-swal-container" },
      });
    }

    if (scope === "all") {
      const fieldLabel = editableFields.find(
        (f) => f.value === selectedField,
      )?.label;
      const confirm = await Swal.fire({
        title: "Масова промяна!",
        text: `Сигурни ли сте, че искате да промените "${fieldLabel}" за ВСИЧКИ обекти в сградата за този месец?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3b82f6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Да, промени всичко",
        customClass: { container: "edit-fee-swal-container" },
      });
      if (!confirm.isConfirmed) return;
    }

    setIsSubmitting(true);

    try {
      if (scope === "single") {
        await updateSingleFee(fee, numericAmount);
      } else {
        await updateAllFees(numericAmount);
      }

      Swal.fire({
        title: "Успешно!",
        text: "Данните бяха обновени успешно.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
        customClass: { container: "edit-fee-swal-container" },
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error("Грешка при обновяване:", error);
      Swal.fire({
        title: "Грешка",
        text: "Възникна проблем при запазването на промените.",
        icon: "error",
        customClass: { container: "edit-fee-swal-container" },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateSingleFee = async (targetFee, amount) => {
    const oldVal = Number(targetFee[selectedField] || 0);
    const diff = actionType === "replace" ? amount - oldVal : amount;
    const newVal = oldVal + diff;

    let newCurrentDue = Number(targetFee.current_month_due || 0);
    let newTotalDue = Number(targetFee.total_due || 0);

    if (selectedField !== "previous_debt") {
      newCurrentDue += diff;
    }
    newTotalDue += diff;

    const { error } = await supabase
      .from("fees")
      .update({
        [selectedField]: newVal,
        current_month_due: newCurrentDue,
        total_due: newTotalDue,
      })
      .eq("id", targetFee.id);

    if (error) throw error;
  };

  const updateAllFees = async (amount) => {
    const { data: allFees, error: fetchError } = await supabase
      .from("fees")
      .select("*")
      .eq("building_id", fee.building_id)
      .eq("month", fee.month)
      .eq("year", fee.year);

    if (fetchError) throw fetchError;

    const updatePromises = allFees.map((f) => updateSingleFee(f, amount));
    await Promise.all(updatePromises);
  };

  const formatOptionLabel = ({ label, icon: Icon }) => (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      {Icon && <Icon size={16} style={{ color: "var(--edit-fee-text-sec)" }} />}
      <span>{label}</span>
    </div>
  );

  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: "var(--edit-fee-bg-main)",
      borderColor: state.isFocused
        ? "var(--edit-fee-primary)"
        : "var(--edit-fee-border)",
      color: "var(--edit-fee-text-main)",
      borderRadius: "8px",
      minHeight: "42px",
      boxShadow: state.isFocused ? "0 0 0 3px rgba(59, 130, 246, 0.1)" : "none",
      cursor: "text",
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: "var(--edit-fee-bg-main)",
      border: "1px solid var(--edit-fee-border)",
      zIndex: 106001,
      borderRadius: "8px",
      overflow: "hidden",
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "var(--edit-fee-primary)"
        : state.isFocused
          ? "var(--edit-fee-bg-sec)"
          : "transparent",
      color: state.isSelected ? "white" : "var(--edit-fee-text-main)",
      cursor: "pointer",
    }),
    singleValue: (base) => ({
      ...base,
      color: "var(--edit-fee-text-main)",
    }),
    input: (base) => ({
      ...base,
      color: "var(--edit-fee-text-main)",
    }),
  };

  if (!isOpen || !fee) return null;

  return (
    <div
      className={`edit-fee-overlay ${isDarkMode ? "edit-fee-dark" : "edit-fee-light"}`}
      onClick={handleOverlayClick}
    >
      <div className="edit-fee-content">
        <div className="edit-fee-header">
          <div className="edit-fee-header-top">
            <span className="edit-fee-badge">РЕДАКЦИЯ НА ТАКСА</span>
            <button
              className="edit-fee-close"
              onClick={onClose}
              disabled={isSubmitting}
            >
              <X size={24} strokeWidth={2.5} />
            </button>
          </div>
          <h1 className="edit-fee-title">
            <Edit size={22} className="edit-fee-icon-main" /> Корекция на данни
          </h1>
        </div>

        <div className="edit-fee-body">
          <div className="edit-fee-form-section">
            <div className="edit-fee-info-panel">
              <div className="edit-fee-info-col">
                <span className="edit-fee-info-label">Първоначален обект:</span>
                <span className="edit-fee-info-value">
                  <User size={16} /> {fee.type} {fee.object_number}
                </span>
              </div>
              <div className="edit-fee-info-col edit-fee-border-left">
                <span className="edit-fee-info-label">Сграда и период:</span>
                <span className="edit-fee-info-value">
                  <Building2 size={16} /> {getMonthNameBG(fee.month)} {fee.year}{" "}
                  г.
                </span>
              </div>
            </div>

            <div className="edit-fee-form">
              <div className="edit-fee-field-group">
                <label className="edit-fee-label">Компонент за редакция</label>
                <Select
                  options={editableFields}
                  value={editableFields.find((f) => f.value === selectedField)}
                  onChange={(option) => setSelectedField(option.value)}
                  formatOptionLabel={formatOptionLabel}
                  styles={customSelectStyles}
                  isSearchable={true}
                  isDisabled={isSubmitting}
                  placeholder="Търси или избери разход..."
                />
              </div>

              <div className="edit-fee-row">
                <div className="edit-fee-field-group">
                  <label className="edit-fee-label">Сума (€)</label>
                  <input
                    type="number"
                    className="edit-fee-input"
                    placeholder=""
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="edit-fee-field-group">
                  <label className="edit-fee-label">Действие</label>
                  <select
                    className="edit-fee-input"
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value)}
                    disabled={isSubmitting}
                    style={{ height: "42px" }}
                  >
                    <option value="add">Добави към текущата</option>
                    <option value="replace">Замени със сумата</option>
                  </select>
                </div>
              </div>

              <div className="edit-fee-scope-box">
                <label className="edit-fee-label edit-fee-margin-bottom">
                  Обхват на промяната
                </label>
                <div className="edit-fee-radio-cards">
                  <div
                    className={`edit-fee-radio-card ${scope === "single" ? "active" : ""}`}
                    onClick={() => !isSubmitting && setScope("single")}
                  >
                    <div className="radio-header">
                      <div className="radio-circle">
                        {scope === "single" && (
                          <CheckCircle2 size={14} strokeWidth={3} />
                        )}
                      </div>
                      <span className="radio-title">Само този обект</span>
                    </div>
                    <p className="radio-desc">
                      {fee.type} {fee.object_number}
                    </p>
                  </div>

                  <div
                    className={`edit-fee-radio-card danger ${scope === "all" ? "active" : ""}`}
                    onClick={() => !isSubmitting && setScope("all")}
                  >
                    <div className="radio-header">
                      <div className="radio-circle">
                        {scope === "all" && (
                          <CheckCircle2 size={14} strokeWidth={3} />
                        )}
                      </div>
                      <span className="radio-title">Масово (Всички)</span>
                    </div>
                    <p className="radio-desc">Цялата сграда</p>
                  </div>
                </div>
              </div>

              <div className="edit-fee-warning">
                <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                <span>
                  Внимание: Текущата и общата сметка ще бъдат преизчислени
                  автоматично въз основа на разликата.
                </span>
              </div>

              <button
                className="edit-fee-submit-btn"
                onClick={handleSubmit}
                disabled={isSubmitting || amountInput.trim() === ""}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="edit-fee-spin" size={20} /> Обработка...
                  </>
                ) : (
                  <>
                    <Save size={20} /> Запази промените
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="edit-fee-breakdown-section">
            <span className="edit-fee-section-label">
              <Calculator size={16} strokeWidth={2.5} /> Текуща разбивка
            </span>
            <div className="edit-fee-math-box">
              {feeComponents.length > 0 ? (
                feeComponents.map((comp, idx) => (
                  <div key={idx} className="math-row">
                    <span>{comp.label}:</span>
                    <span>{formatEuro(comp.value)}</span>
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
                  <span>Корекция от закръгляне:</span>
                  <span>+ {formatEuro(fee.rounding_remainder)}</span>
                </div>
              )}
              <div className="math-divider"></div>
              <div className="math-row total">
                <span>Общо:</span>
                <span>{formatEuro(fee.current_month_due)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditFee;
