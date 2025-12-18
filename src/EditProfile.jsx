import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import { useTheme } from "./components/ThemeContext";
import bcrypt from "bcryptjs";
import "./styles/EditProfile.css";

function EditProfile() {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  
  // Използваме useRef, за да сме сигурни, че компонентът е "жив",
  // когато обновяваме state-а (предпазва от грешки при бързо излизане)
  const mountedRef = useRef(true);

  const [loading, setLoading] = useState(true);
  const [authId, setAuthId] = useState(null);

  // Данни
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
    mountedRef.current = true;

    async function getUserData() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          if (mountedRef.current) navigate("/login");
          return;
        }

        if (mountedRef.current) {
          setAuthId(user.id);
          setEmail(user.email);
        }

        const { data: profileData, error: dbError } = await supabase
          .from("users")
          .select("*")
          .eq("auth_user_id", user.id)
          .maybeSingle();

        if (!dbError && profileData && mountedRef.current) {
          setFirstName(profileData.first_name || "");
          setLastName(profileData.last_name || "");
          setUsername(profileData.username || "");
          setPhone(profileData.phone || "");
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    }

    getUserData();

    return () => { mountedRef.current = false; };
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

        if (funcError || (data && data.error)) {
            throw new Error(funcError?.message || data.error || "Грешка при смяна на имейла.");
        }
      }

      const { error: dbError } = await supabase
        .from("users")
        .update(profileUpdates)
        .eq("auth_user_id", authId);

      if (dbError) throw dbError;

      setMessage("✅ Данните са обновени успешно!");
      setMessageType("success");
      
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const updatedUser = { ...storedUser, ...profileUpdates, first_name: firstName, last_name: lastName };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      
      window.dispatchEvent(new Event("storage"));

      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
          if(mountedRef.current) navigate(-1);
      }, 1500);

    } catch (error) {
      console.error("Грешка:", error);
      setMessage(`⚠️ Грешка: ${error.message}`);
      setMessageType("error");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  // ВАЖНО: Показваме зареждане винаги, когато loading е true.
  // Това оправя "мигването" и изчезването.
  if (loading) return <div className="ep-loading"><span className="ep-spinner">↻</span> Зареждане...</div>;

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
              value={`${firstName} ${lastName}`.trim()}
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