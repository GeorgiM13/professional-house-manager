import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { useTheme } from "../../components/ThemeContext";
import CustomAlert from "../../components/CustomAlert";
import ConfirmModal from "../../components/ConfirmModal";
import "./styles/EditGlobalUser.css";

function EditGlobalUser() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode } = useTheme();

  const [formData, setFormData] = useState({
    first_name: "",
    second_name: "",
    last_name: "",
    phone: "",
    email: "",
    company_name: "",
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
          .eq("id", id)
          .single();

        if (error) throw error;

        setFormData({
          first_name: data.first_name || "",
          second_name: data.second_name || "",
          last_name: data.last_name || "",
          phone: data.phone || "",
          email: data.email || "",
          company_name: data.company_name || "",
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

    fetchUser();
  }, [id]);

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
          console.error("Auth update error:", funcError);
          let msg = "Неуспешна смяна на Auth имейл.";
          try {
              if (funcError && typeof funcError === 'object') {
                  msg = funcError.message || JSON.stringify(funcError);
              }
          } catch(e) {}
          
          throw new Error(msg);
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
          role: formData.role,
        })
        .eq("id", id);

      if (error) throw error;

      setAlert({
        show: true,
        message: "✅ Профилът и данните за вход са обновени успешно!",
        type: "success",
      });

      setTimeout(() => {
        goBack();
      }, 1500);
    } catch (err) {
      console.error("Update error:", err);
      let displayMsg = err.message;
      if (displayMsg.includes('{"error":')) {
          try {
              const parsed = JSON.parse(displayMsg);
              if (parsed.error) displayMsg = parsed.error;
          } catch(e) {}
      }
      
      setAlert({ show: true, message: "Грешка: " + displayMsg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setShowConfirm(false);
    try {
      const { error } = await supabase.from("users").delete().eq("id", id);
      if (error) throw error;

      setAlert({
        show: true,
        message: "Потребителят е изтрит.",
        type: "success",
      });
      setTimeout(() => navigate("/admin/users"), 1500);
    } catch (err) {
      console.error("Delete error:", err);
      setAlert({
        show: true,
        message:
          "Не може да бъде изтрит. Вероятно притежава имоти или има свързани данни.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    navigate("/admin/users", {
      state: {
        search: location.state?.search,
        page: location.state?.page,
      },
    });
  };

  if (fetching)
    return (
      <div
        className="loading-text"
        style={{ padding: "2rem", textAlign: "center" }}
      >
        Зареждане...
      </div>
    );

  return (
    <div className={`egu-container ${isDarkMode ? "au-dark" : "au-light"}`}>
      <div className="egu-header">
        <h1>Редакция на профил</h1>
        <p>Промяна на лични данни и контакти</p>
      </div>

      <div className="egu-card">
        <div className="egu-form-grid">
          <div className="egu-form-group">
            <label>Име *</label>
            <input
              name="first_name"
              className="egu-input"
              value={formData.first_name}
              onChange={handleChange}
            />
          </div>

          <div className="egu-form-group">
            <label>Презиме</label>
            <input
              name="second_name"
              className="egu-input"
              value={formData.second_name}
              onChange={handleChange}
            />
          </div>

          <div className="egu-form-group">
            <label>Фамилия *</label>
            <input
              name="last_name"
              className="egu-input"
              value={formData.last_name}
              onChange={handleChange}
            />
          </div>

          <div className="egu-form-group">
            <label>Фирма</label>
            <input
              name="company_name"
              className="egu-input"
              placeholder="напр. ЕООД..."
              value={formData.company_name}
              onChange={handleChange}
            />
          </div>

          <div className="egu-form-group full-width">
            <label>Email адрес (Вход)</label>
            <input
              name="email"
              type="email"
              className="egu-input"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="egu-form-group">
            <label>Телефон</label>
            <input
              name="phone"
              className="egu-input"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <div className="egu-form-group">
            <label>Роля в системата</label>
            <select
              name="role"
              className="egu-select"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="user">Потребител</option>
              <option value="admin">Администратор</option>
            </select>
          </div>
        </div>

        <div className="egu-actions">
          <button
            className="egu-btn egu-btn-danger"
            onClick={() => setShowConfirm(true)}
            disabled={loading}
          >
            🗑️ Изтрий
          </button>
          <button
            className="egu-btn egu-btn-secondary"
            onClick={goBack}
            disabled={loading}
          >
            Отказ
          </button>
          <button
            className="egu-btn egu-btn-primary"
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
  );
}

export default EditGlobalUser;