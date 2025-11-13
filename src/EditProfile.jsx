import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import "./styles/EditProfile.css";

function EditProfile() {
  const navigate = useNavigate();

  const [savedUser, setSavedUser] = useState(() => {
    return JSON.parse(localStorage.getItem("user")) || {};
  });
  const [userData, setUserData] = useState(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function restoreSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (error || !user) {
          console.warn(
            "Няма активна сесия — потребителят трябва да се логне отново."
          );
        }
      }
    }
    restoreSession();
  }, []);

  useEffect(() => {
    async function fetchUserData() {
      if (!savedUser?.id) return;
      localStorage.removeItem(`userData_${savedUser.id}`);

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", savedUser.id)
        .single();

      if (!error && data) {
        setUserData(data);
        setUsername(data.username || "");
        setEmail(data.email || "");
        setPhone(data.phone || "");
        localStorage.setItem(`userData_${savedUser.id}`, JSON.stringify(data));
      }
    }

    fetchUserData();
  }, [savedUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password && password !== confirmPassword) {
      setMessage("⚠️ Паролите не съвпадат.");
      return;
    }

    const updates = {};

    if (password) {
      const { error: passError } = await supabase.auth.updateUser({ password });
      if (passError) {
        setMessage("⚠️ Грешка при промяна на паролата!");
        console.error(passError);
        return;
      }
      updates.password_hash = password;
    }

    if (email && email !== userData.email) {
      const { error: emailError } = await supabase.auth.updateUser({ email });
      if (emailError) {
        console.error("Auth email update error:", emailError);
        setMessage("⚠️ Грешка при промяна на имейла в Auth!");
        return;
      }

      updates.email = email;
      setMessage(
        "📩 Изпратен е имейл за потвърждение. Моля, потвърдете новия адрес, за да влезете с него."
      );
    }

    if (username !== userData.username) updates.username = username;
    if (phone !== userData.phone) updates.phone = phone;

    if (Object.keys(updates).length === 0) {
      setMessage("Няма промени за записване.");
      return;
    }

    const { error: dbError } = await supabase
      .from("users")
      .update(updates)
      .eq("id", savedUser.id);

    if (dbError) {
      console.error("Supabase update error:", dbError);
      setMessage("⚠️ Грешка при запис в базата данни!");
      return;
    }

    const updatedUser = { ...savedUser, ...updates };
    localStorage.setItem("user", JSON.stringify(updatedUser));
    localStorage.setItem(
      `userData_${savedUser.id}`,
      JSON.stringify({ ...userData, ...updates })
    );

    if (email && email !== userData.email) {
      setMessage(
        "📧 Данните са записани. Проверете пощата си и потвърдете новия имейл."
      );
      return;
    }

    setMessage("✅ Данните са успешно обновени!");
    setTimeout(() => navigate(-1), 2000);
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="edit-profile-container">
      <h2>Промяна на данни</h2>
      <form onSubmit={handleSubmit} className="edit-profile-form">
        <label>
          Три имена:
          <input
            type="text"
            value={`${userData?.first_name || ""} ${
              userData?.second_name || ""
            } ${userData?.last_name || ""}`}
            readOnly
          />
        </label>

        <label>
          Имейл:
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label>
          Потребителско име:
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </label>

        <label>
          Телефон:
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </label>

        <label>
          Нова парола:
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        <label>
          Потвърди паролата:
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </label>

        <div className="form-actions">
          <button type="submit" className="save-button">
            Запази
          </button>
          <button
            type="button"
            className="cancel-button"
            onClick={handleCancel}
          >
            Отказ
          </button>
        </div>
      </form>

      {message && <p className="success-message">{message}</p>}
    </div>
  );
}

export default EditProfile;
