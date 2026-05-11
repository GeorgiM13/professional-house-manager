import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { useTheme } from "../../components/ThemeContext";
import CustomAlert from "../../components/CustomAlert";
import ConfirmModal from "../../components/ConfirmModal";
import { User, Lock, Trash2, X, Briefcase } from "lucide-react";
import "./styles/EditGlobalUser.css";

function EditGlobalUser({ userId, onClose, onSuccess }) {
  const { isDarkMode } = useTheme();

  const [formData, setFormData] = useState({
    first_name: "",
    second_name: "",
    last_name: "",
    phone: "",
    email: "",
    company_name: "",
    company_eik: "",
    company_mol: "",
    company_address: "",
    role: "user",
  });

  const [authUserId, setAuthUserId] = useState("");
  const [originalEmail, setOriginalEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [alert, setAlert] = useState({
    show: false,
    message: "",
    type: "info",
  });
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", userId)
          .single();

        if (error) throw error;

        setFormData({
          first_name: data.first_name || "",
          second_name: data.second_name || "",
          last_name: data.last_name || "",
          phone: data.phone || "",
          email: data.email || "",
          company_name: data.company_name || "",
          company_eik: data.company_eik || "",
          company_mol: data.company_mol || "",
          company_address: data.company_address || "",
          role: data.role || "user",
        });

        setOriginalEmail(data.email || "");
        setAuthUserId(data.auth_user_id);
      } catch (err) {
        console.error("Error loading user:", err);
        setAlert({
          show: true,
          message: "Грешка при зареждане на данните.",
          type: "error",
        });
      } finally {
        setFetching(false);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (formData.email && formData.email !== originalEmail) {
        if (!authUserId) {
          throw new Error("Липсва Auth User ID. Не може да се промени входът.");
        }

        const { data: funcData, error: funcError } =
          await supabase.functions.invoke("update-user-email", {
            body: {
              userId: authUserId,
              newEmail: formData.email,
            },
          });

        if (funcError) {
          throw new Error("Неуспешна смяна на Auth имейл.");
        }
      }

      const { error } = await supabase
        .from("users")
        .update({
          first_name: formData.first_name,
          second_name: formData.second_name,
          last_name: formData.last_name,
          phone: formData.phone,
          email: formData.email,
          company_name: formData.company_name,
          company_eik: formData.company_eik,
          company_mol: formData.company_mol,
          company_address: formData.company_address,
          role: formData.role,
        })
        .eq("id", userId);

      if (error) throw error;

      setAlert({
        show: true,
        message: "Профилът е обновен успешно!",
        type: "success",
      });

      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (err) {
      console.error("Update error:", err);
      setAlert({
        show: true,
        message: "Грешка: " + err.message,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setShowConfirm(false);
    try {
      const { error } = await supabase.from("users").delete().eq("id", userId);
      if (error) throw error;

      setAlert({
        show: true,
        message: "Потребителят е изтрит.",
        type: "success",
      });
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (err) {
      setAlert({
        show: true,
        message: "Не може да бъде изтрит. Има свързани данни.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetching)
    return (
      <div className="adm-editguser-overlay">
        <div className={`adm-editguser-modal ${isDarkMode ? "dark" : "light"}`}>
          <div className="adm-editguser-loading-state">Зареждане...</div>
        </div>
      </div>
    );

  return (
    <div className="adm-editguser-overlay" onClick={onClose}>
      <div
        className={`adm-editguser-modal ${isDarkMode ? "dark" : "light"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="adm-editguser-close" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="adm-editguser-header">
          <div>
            <h1>Редакция на профил</h1>
            <p>Промяна на лични данни и контакти</p>
          </div>
        </div>

        <div className="adm-editguser-grid">
          <div className="adm-editguser-col">
            <div className="adm-editguser-card">
              <div className="adm-editguser-card-title">
                <User
                  size={20}
                  strokeWidth={2.5}
                  className="adm-editguser-card-icon"
                />{" "}
                Лични данни
              </div>

              <div className="adm-editguser-row">
                <div className="adm-editguser-form-group">
                  <label>Име *</label>
                  <input
                    name="first_name"
                    className="adm-editguser-input"
                    value={formData.first_name}
                    onChange={handleChange}
                  />
                </div>

                <div className="adm-editguser-form-group">
                  <label>Презиме</label>
                  <input
                    name="second_name"
                    className="adm-editguser-input"
                    value={formData.second_name}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="adm-editguser-row">
                <div className="adm-editguser-form-group">
                  <label>Фамилия *</label>
                  <input
                    name="last_name"
                    className="adm-editguser-input"
                    value={formData.last_name}
                    onChange={handleChange}
                  />
                </div>

                <div className="adm-editguser-form-group">
                  <label>Телефон</label>
                  <input
                    name="phone"
                    className="adm-editguser-input"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="adm-editguser-form-group">
                <label>Email адрес (Вход)</label>
                <input
                  name="email"
                  type="email"
                  className="adm-editguser-input"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="adm-editguser-card">
              <div className="adm-editguser-card-title">
                <Briefcase
                  size={20}
                  strokeWidth={2.5}
                  className="adm-editguser-card-icon"
                />{" "}
                Данни за фактура (Фирма)
              </div>

              <div className="adm-editguser-row">
                <div className="adm-editguser-form-group">
                  <label>Име на фирма</label>
                  <input
                    name="company_name"
                    className="adm-editguser-input"
                    value={formData.company_name}
                    onChange={handleChange}
                  />
                </div>
                <div className="adm-editguser-form-group">
                  <label>ЕИК / БУЛСТАТ</label>
                  <input
                    name="company_eik"
                    className="adm-editguser-input"
                    value={formData.company_eik}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="adm-editguser-row">
                <div className="adm-editguser-form-group">
                  <label>МОЛ</label>
                  <input
                    name="company_mol"
                    className="adm-editguser-input"
                    value={formData.company_mol}
                    onChange={handleChange}
                  />
                </div>
                <div className="adm-editguser-form-group">
                  <label>Адрес на регистрация</label>
                  <input
                    name="company_address"
                    className="adm-editguser-input"
                    value={formData.company_address}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="adm-editguser-col">
            <div className="adm-editguser-card">
              <div className="adm-editguser-card-title">
                <Lock
                  size={20}
                  strokeWidth={2.5}
                  className="adm-editguser-card-icon"
                />{" "}
                Настройки и Роля
              </div>

              <div className="adm-editguser-form-group">
                <label>Роля в системата</label>
                <select
                  name="role"
                  className="adm-editguser-select"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="user">Потребител</option>
                  <option value="admin">Администратор</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="adm-editguser-actions-container">
          <button
            className="adm-editguser-btn adm-editguser-btn-danger"
            onClick={() => setShowConfirm(true)}
            disabled={loading}
          >
            <Trash2 size={18} strokeWidth={2.5} /> Изтрий
          </button>

          <div className="adm-editguser-actions-right">
            <button
              className="adm-editguser-btn adm-editguser-btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Отказ
            </button>
            <button
              className="adm-editguser-btn adm-editguser-btn-primary"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? "Запазване..." : "Запази промените"}
            </button>
          </div>
        </div>

        <CustomAlert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert({ ...alert, show: false })}
          visible={alert.show}
        />

        {showConfirm && (
          <ConfirmModal
            title="Изтриване на потребител"
            message="Сигурни ли сте? Това действие е необратимо."
            onConfirm={handleDelete}
            onCancel={() => setShowConfirm(false)}
          />
        )}
      </div>
    </div>
  );
}

export default EditGlobalUser;
