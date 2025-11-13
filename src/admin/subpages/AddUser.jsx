import { useState } from "react";
import { useNavigate } from "react-router-dom";
import bcrypt from "bcryptjs";
import Swal from "sweetalert2";
import { supabase } from "../../supabaseClient";
import "./styles/AddUser.css";

function AddUser() {
  const [firstName, setFirstName] = useState("");
  const [secondName, setSecondName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");
  const [errors, setErrors] = useState({});

  const navigate = useNavigate();

  function generateSecurePassword(length = 10) {
    const chars =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$";
    return Array.from(
      { length },
      () => chars[Math.floor(Math.random() * chars.length)]
    ).join("");
  }

  const handleSave = async () => {
    const newErrors = {};

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

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

    const baseUsername = `${clean(firstName)}${clean(lastName)}`;
    const username = `${baseUsername}_${Math.floor(Math.random() * 10000)}`;
    const generatedEmail = `${baseUsername}@example.com`;
    const finalEmail = email || generatedEmail;
    const password = generateSecurePassword(10);
    const passwordHash = await bcrypt.hash(password, 10);
    const displayName = `${firstName} ${secondName} ${lastName}`.trim();

    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", finalEmail)
      .maybeSingle();

    if (existing) {
      await Swal.fire({
        icon: "error",
        title: "⚠️ Имейлът вече съществува",
        text: "Вече има потребител с този имейл.",
      });
      return;
    }

    const { data: authUser, error: authError } = await supabase.auth.signUp(
      { email: finalEmail, password },
      { data: { display_name: displayName } }
    );

    if (authError) {
      await Swal.fire({
        icon: "error",
        title: "Грешка при създаване на акаунт",
        text: authError.message,
      });
      return;
    }

    const { data: newUser, error: userError } = await supabase
      .from("users")
      .insert([
        {
          id: authUser.user.id,
          first_name: firstName,
          second_name: secondName,
          last_name: lastName,
          phone,
          role,
          username,
          email: finalEmail,
          password_hash: passwordHash,
        },
      ])
      .select()
      .single();

    if (userError) {
      await Swal.fire({
        icon: "error",
        title: "Грешка при запис в базата",
        text: userError.message,
      });
      return;
    }
    await Swal.fire({
      title: "✅ Потребителят е създаден успешно!",
      html: `
          <div style="text-align:left; font-size:16px;">
            <p><b>👤 Потребителско име:</b> ${username}</p>
            <p><b>📧 Имейл:</b> ${finalEmail}</p>
            <p><b>🔑 Парола:</b> <span id="password-text">${password}</span></p>
          </div>
        `,
      icon: "success",
      showCancelButton: false,
      confirmButtonText: "Затвори и продължи",
      footer:
        '<button id="copy-btn" class="swal2-styled" style="background:#2563eb;">📋 Копирай паролата</button>',
      didRender: () => {
        document.getElementById("copy-btn").onclick = () => {
          navigator.clipboard.writeText(password);
          Swal.showValidationMessage("✅ Паролата е копирана!");
          setTimeout(() => Swal.resetValidationMessage(), 2000);
        };
      },
    });
    navigate("/admin/users");
  };

  return (
    <div className="add-user-container">
      <div className="form-header">
        <h1>Добавяне на нов потребител</h1>
        <p>Попълнете формата, за да добавите нов потребител</p>
      </div>

      <div className="user-form">
        <div className="form-grid">
          <div className={`form-group ${errors.firstName ? "has-error" : ""}`}>
            <label>Първо име *</label>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            {errors.firstName && (
              <span className="error-message">{errors.firstName}</span>
            )}
          </div>

          <div className="form-group">
            <label>Презиме</label>
            <input
              value={secondName}
              onChange={(e) => setSecondName(e.target.value)}
            />
          </div>

          <div className={`form-group ${errors.lastName ? "has-error" : ""}`}>
            <label>Фамилия *</label>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
            {errors.lastName && (
              <span className="error-message">{errors.lastName}</span>
            )}
          </div>

          <div className="form-group">
            <label>Имейл</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Оставете празно за автоматичен имейл"
            />
          </div>

          <div className="form-group">
            <label>Телефон</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          <div className="form-group">
            <label>Роля</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="user">Потребител</option>
              <option value="admin">Администратор</option>
            </select>
          </div>
        </div>

        <div className="form-actions">
          <button className="primary-button" onClick={handleSave}>
            Запази
          </button>
          <button
            className="secondary-button"
            onClick={() => navigate("/admin/users")}
          >
            Отказ
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddUser;
