import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import { useTheme } from "./components/ThemeContext";
import bcrypt from "bcryptjs";
import "./styles/EditProfile.css";

function EditProfile() {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  const [loading, setLoading] = useState(true);
  const [authId, setAuthId] = useState(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState("");

  useEffect(() => {
    async function getUserData() {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        navigate("/login");
        return;
      }

      setAuthId(user.id);
      setEmail(user.email);

      const { data: profileData, error: dbError } = await supabase
        .from("users")
        .select("*")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (!dbError && profileData) {
        setFirstName(profileData.first_name || "");
        setLastName(profileData.last_name || "");
        setUsername(profileData.username || "");
        setPhone(profileData.phone || "");
      }
      setLoading(false);
    }

    getUserData();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (password && password !== confirmPassword) {
      setMessage("⚠️ Паролите не съвпадат.");
      setMessageType("error");
      return;
    }

    try {
      setLoading(true);

      const profileUpdates = {
        username,
        phone,
        email
      };

      if (password) {
        const { error: passError } = await supabase.auth.updateUser({ password });
        if (passError) throw passError;
        
        const hashedPassword = await bcrypt.hash(password, 10);
        profileUpdates.password_hash = hashedPassword;
      }

      const currentUser = await supabase.auth.getUser();
      const currentEmail = currentUser.data.user?.email;

      if (email && email !== currentEmail) {
        const { data, error: funcError } = await supabase.functions.invoke('update-email', {
          body: { userId: authId, newEmail: email }
        });

        if (funcError) {
            console.error("Edge function error:", funcError);
            throw new Error("Грешка при смяна на имейла.");
        }
        
        if (data && data.error) {
            throw new Error(data.error);
        }
      }

      const { error: dbError } = await supabase
        .from("users")
        .update(profileUpdates)
        .eq("auth_user_id", authId);

      if (dbError) throw dbError;

      setMessage("✅ Данните (вкл. имейла) са обновени веднага!");
      setMessageType("success");

      setPassword("");
      setConfirmPassword("");

      setTimeout(() => navigate(-1), 1500);

    } catch (error) {
      console.error("Грешка:", error);
      setMessage(`⚠️ Грешка: ${error.message}`);
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !authId) return <div className="ep-loading">Зареждане...</div>;

  return (
    <div className={`ep-wrapper ${isDarkMode ? "au-dark" : "au-light"}`}>
      <div className="ep-card fade-in">
        <div className="ep-header">
          <h2>Редактиране на профил</h2>
          <p>Актуализирайте личната си информация</p>
        </div>

        <form onSubmit={handleSubmit} className="ep-form">
          <div className="ep-section">
            <label className="ep-label">Имена (системен запис)</label>
            <input
              className="ep-input readonly"
              type="text"
              value={`${firstName} ${lastName}`}
              readOnly
              disabled
            />
          </div>

          <div className="ep-grid">
            <div className="ep-field">
              <label className="ep-label">Потребителско име</label>
              <input
                className="ep-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="ep-field">
              <label className="ep-label">Телефон</label>
              <input
                className="ep-input"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="ep-field">
            <label className="ep-label">Имейл адрес</label>
            <input
              className="ep-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <hr className="ep-divider" />

          <h3 className="ep-subheading">🔐 Смяна на парола</h3>
          <div className="ep-grid">
            <div className="ep-field">
              <label className="ep-label">Нова парола</label>
              <input
                className="ep-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Въведете нова парола"
                autoComplete="new-password"
              />
            </div>
            <div className="ep-field">
              <label className="ep-label">Потвърди паролата</label>
              <input
                className="ep-input"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Повторете паролата"
                autoComplete="new-password"
              />
            </div>
          </div>

          {message && (
            <div className={`ep-message ${messageType}`}>{message}</div>
          )}

          <div className="ep-actions">
            <button
              type="button"
              className="ep-btn ep-btn-secondary"
              onClick={() => navigate(-1)}
            >
              Отказ
            </button>
            <button
              type="submit"
              className="ep-btn ep-btn-primary"
              disabled={loading}
            >
              {loading ? "Записване..." : "Запази промените"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProfile;
