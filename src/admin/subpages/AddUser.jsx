import { useState } from "react";
import bcrypt from "bcryptjs";
import Swal from "sweetalert2";
import { supabase } from "../../supabaseClient";
import { useTheme } from "../../components/ThemeContext";
import { User, Lock, Info, X, Briefcase } from "lucide-react";
import "./styles/AddUser.css";

function AddUser({ onClose, onSuccess }) {
  const { isDarkMode } = useTheme();

  const [firstName, setFirstName] = useState("");
  const [secondName, setSecondName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [companyEik, setCompanyEik] = useState("");
  const [companyMol, setCompanyMol] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");

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

      const { data, error } = await supabase.functions.invoke("create-user", {
        body: {
          email: finalEmail,
          password: password,
          userData: {
            first_name: firstName,
            second_name: secondName,
            last_name: lastName,
            phone: phone,
            company_name: companyName,
            company_eik: companyEik,
            company_mol: companyMol,
            company_address: companyAddress,
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

      if (onSuccess) onSuccess();
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

  return (
    <div className="adm-adduser-overlay" onClick={onClose}>
      <div
        className={`adm-adduser-modal ${isDarkMode ? "dark" : "light"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="adm-adduser-close" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="adm-adduser-header">
          <div>
            <h1>Добавяне на потребител</h1>
            <p>Създаване на нов профил в системата</p>
          </div>
        </div>

        <div className="adm-adduser-grid">
          <div className="adm-adduser-col">
            <div className="adm-adduser-card">
              <div className="adm-adduser-card-title">
                <User
                  size={20}
                  strokeWidth={2.5}
                  className="adm-adduser-card-icon"
                />{" "}
                Лични данни
              </div>

              <div className="adm-adduser-row">
                <div className="adm-adduser-form-group">
                  <label>Първо име *</label>
                  <input
                    className={`adm-adduser-input ${errors.firstName ? "has-error" : ""}`}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                  {errors.firstName && (
                    <span className="adm-adduser-error-msg">
                      {errors.firstName}
                    </span>
                  )}
                </div>

                <div className="adm-adduser-form-group">
                  <label>Презиме</label>
                  <input
                    className="adm-adduser-input"
                    value={secondName}
                    onChange={(e) => setSecondName(e.target.value)}
                  />
                </div>
              </div>

              <div className="adm-adduser-row">
                <div className="adm-adduser-form-group">
                  <label>Фамилия *</label>
                  <input
                    className={`adm-adduser-input ${errors.lastName ? "has-error" : ""}`}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                  {errors.lastName && (
                    <span className="adm-adduser-error-msg">
                      {errors.lastName}
                    </span>
                  )}
                </div>

                <div className="adm-adduser-form-group">
                  <label>Телефон</label>
                  <input
                    className="adm-adduser-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="adm-adduser-form-group">
                <label>Имейл</label>
                <input
                  type="email"
                  className="adm-adduser-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Авт. генериране ако е празно"
                />
              </div>
            </div>

            <div className="adm-adduser-card">
              <div className="adm-adduser-card-title">
                <Briefcase
                  size={20}
                  strokeWidth={2.5}
                  className="adm-adduser-card-icon"
                />{" "}
                Данни за фактура (Фирма - Опционално)
              </div>

              <div className="adm-adduser-row">
                <div className="adm-adduser-form-group">
                  <label>Име на фирма</label>
                  <input
                    className="adm-adduser-input"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Напр. ЕООД..."
                  />
                </div>
                <div className="adm-adduser-form-group">
                  <label>ЕИК / БУЛСТАТ</label>
                  <input
                    className="adm-adduser-input"
                    value={companyEik}
                    onChange={(e) => setCompanyEik(e.target.value)}
                  />
                </div>
              </div>

              <div className="adm-adduser-row">
                <div className="adm-adduser-form-group">
                  <label>МОЛ</label>
                  <input
                    className="adm-adduser-input"
                    value={companyMol}
                    onChange={(e) => setCompanyMol(e.target.value)}
                  />
                </div>
                <div className="adm-adduser-form-group">
                  <label>Адрес на регистрация</label>
                  <input
                    className="adm-adduser-input"
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="adm-adduser-col">
            <div className="adm-adduser-card">
              <div className="adm-adduser-card-title">
                <Lock
                  size={20}
                  strokeWidth={2.5}
                  className="adm-adduser-card-icon"
                />{" "}
                Настройки и Роля
              </div>

              <div className="adm-adduser-form-group">
                <label>Роля в системата</label>
                <select
                  className="adm-adduser-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="user">Потребител</option>
                  <option value="admin">Администратор</option>
                </select>
              </div>

              <div className="adm-adduser-info-box">
                <div className="adm-adduser-info-item">
                  <Info
                    size={16}
                    strokeWidth={2.5}
                    className="adm-adduser-info-icon"
                  />
                  <span>
                    <strong>Потребител:</strong> Достъп само до своите имоти и
                    сметки.
                  </span>
                </div>
                <div className="adm-adduser-info-item">
                  <Info
                    size={16}
                    strokeWidth={2.5}
                    className="adm-adduser-info-icon"
                  />
                  <span>
                    <strong>Администратор:</strong> Пълен достъп до всички
                    настройки на системата.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="adm-adduser-actions">
          <button
            className="adm-adduser-btn adm-adduser-btn-secondary"
            onClick={onClose}
          >
            Отказ
          </button>
          <button
            className="adm-adduser-btn adm-adduser-btn-primary"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Създаване..." : "Запази потребителя"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddUser;
