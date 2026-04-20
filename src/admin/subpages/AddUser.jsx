import { useState } from "react";
import { useNavigate } from "react-router-dom";
import bcrypt from "bcryptjs";
import Swal from "sweetalert2";
import { supabase } from "../../supabaseClient";
import { useTheme } from "../../components/ThemeContext";
import { User, Lock, Info } from "lucide-react";
import "./styles/AddUser.css";

function AddUser() {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [secondName, setSecondName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function generateSecurePassword(length = 10) {
    const chars =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$";
    return Array.from(
      { length },
      () => chars[Math.floor(Math.random() * chars.length)],
    ).join("");
  }

  const handleSave = async () => {
    const newErrors = {};
    if (!firstName.trim()) newErrors.firstName = "Полето е задължително";
    if (!lastName.trim()) newErrors.lastName = "Полето е задължително";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const transliterate = (str) => {
        const map = {
          а: "a",
          б: "b",
          в: "v",
          г: "g",
          д: "d",
          е: "e",
          ж: "zh",
          з: "z",
          и: "i",
          й: "y",
          к: "k",
          л: "l",
          м: "m",
          н: "n",
          о: "o",
          п: "p",
          р: "r",
          с: "s",
          т: "t",
          у: "u",
          ф: "f",
          х: "h",
          ц: "ts",
          ч: "ch",
          ш: "sh",
          щ: "sht",
          ъ: "a",
          ь: "",
          ю: "yu",
          я: "ya",
        };
        return str
          .toLowerCase()
          .split("")
          .map((c) => map[c] || c)
          .join("");
      };

      const clean = (str) =>
        transliterate(str).replace(/[.,]/g, "").replace(/\s+/g, "_");

      const randomSuffix = Math.floor(Math.random() * 10000);

      const baseUsername = `${clean(firstName)}${clean(lastName)}`;
      const username = `${baseUsername}_${randomSuffix}`;
      const generatedEmail = `${baseUsername}_${randomSuffix}@example.com`;
      const finalEmail = email.trim() ? email : generatedEmail;

      const password = generateSecurePassword(10);
      const passwordHash = await bcrypt.hash(password, 10);
      const displayName = `${firstName} ${secondName} ${lastName}`.trim();

      const { data, error } = await supabase.functions.invoke("create-user", {
        body: {
          email: finalEmail,
          password: password,
          userData: {
            first_name: firstName,
            second_name: secondName,
            last_name: lastName,
            company_name: companyName,
            phone: phone,
            role: role,
            username: username,
            password_hash: passwordHash,
          },
        },
      });

      if (error)
        throw new Error(error.message || "Грешка при извикване на функцията");

      if (data && data.error) {
        throw new Error(data.error);
      }

      await Swal.fire({
        title: "Потребителят е създаден!",
        html: `
            <div class="swal-user-info">
              <p><b>Потребителско име:</b> ${username}</p>
              <p><b>Имейл:</b> ${finalEmail}</p>
              <p><b>Парола:</b> <span class="swal-password-badge">${password}</span></p>
            </div>
          `,
        icon: "success",
        confirmButtonText: "Затвори и продължи",
        confirmButtonColor: "#3b82f6",
        footer:
          '<button id="copy-btn" class="swal2-styled swal-copy-btn">Копирай паролата</button>',
        didRender: () => {
          const btn = document.getElementById("copy-btn");
          if (btn) {
            btn.onclick = () => {
              navigator.clipboard.writeText(password);
              Swal.showValidationMessage("Паролата е копирана!");
              setTimeout(() => Swal.resetValidationMessage(), 2000);
            };
          }
        },
      });

      navigate("/admin/users");
    } catch (err) {
      console.error("Грешка:", err);
      await Swal.fire({
        icon: "error",
        title: "Грешка",
        text: err.message,
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    navigate("/admin/users");
  };

  return (
    <div className={`adu-container ${isDarkMode ? "au-dark" : "au-light"}`}>
      <div className="adu-header">
        <div>
          <h1>Добавяне на потребител</h1>
          <p>Създаване на нов профил в системата</p>
        </div>
        <button className="adu-btn adu-btn-secondary" onClick={goBack}>
          Назад
        </button>
      </div>

      <div className="adu-grid">
        <div className="adu-card">
          <div className="adu-card-title">
            <User size={20} strokeWidth={2.5} className="adu-card-icon" /> Лични
            данни
          </div>

          <div className="adu-row">
            <div className="adu-form-group">
              <label>Първо име *</label>
              <input
                className={`adu-input ${errors.firstName ? "has-error" : ""}`}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              {errors.firstName && (
                <span className="error-msg">{errors.firstName}</span>
              )}
            </div>

            <div className="adu-form-group">
              <label>Презиме</label>
              <input
                className="adu-input"
                value={secondName}
                onChange={(e) => setSecondName(e.target.value)}
              />
            </div>
          </div>

          <div className="adu-row">
            <div className="adu-form-group">
              <label>Фамилия *</label>
              <input
                className={`adu-input ${errors.lastName ? "has-error" : ""}`}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
              {errors.lastName && (
                <span className="error-msg">{errors.lastName}</span>
              )}
            </div>

            <div className="adu-form-group">
              <label>Фирма</label>
              <input
                className="adu-input"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
          </div>

          <div className="adu-row">
            <div className="adu-form-group">
              <label>Телефон</label>
              <input
                className="adu-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="adu-form-group">
              <label>Имейл</label>
              <input
                type="email"
                className="adu-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Авт. генериране ако е празно"
              />
            </div>
          </div>
        </div>

        <div className="adu-card">
          <div className="adu-card-title">
            <Lock size={20} strokeWidth={2.5} className="adu-card-icon" />{" "}
            Настройки и Роля
          </div>

          <div className="adu-form-group">
            <label>Роля в системата</label>
            <select
              className="adu-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="user">Потребител</option>
              <option value="admin">Администратор</option>
            </select>
          </div>

          <div className="adu-info-box">
            <div className="adu-info-item">
              <Info size={16} strokeWidth={2.5} className="adu-info-icon" />
              <span>
                <strong>Потребител:</strong> Достъп само до своите имоти и
                сметки.
              </span>
            </div>
            <div className="adu-info-item">
              <Info size={16} strokeWidth={2.5} className="adu-info-icon" />
              <span>
                <strong>Администратор:</strong> Пълен достъп до всички настройки
                на системата.
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="adu-actions">
        <button className="adu-btn adu-btn-secondary" onClick={goBack}>
          Отказ
        </button>
        <button
          className="adu-btn adu-btn-primary"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? "Създаване..." : "Запази потребителя"}
        </button>
      </div>
    </div>
  );
}

export default AddUser;
