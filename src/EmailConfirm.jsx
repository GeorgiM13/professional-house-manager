import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";

function EmailConfirm() {
  const [message, setMessage] = useState("Потвърждаваме имейла...");
  const navigate = useNavigate();

  useEffect(() => {
    async function handleConfirmation() {
      const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);

      if (error) {
        console.error("Email confirm error:", error.message);
        setMessage("⚠️ Грешка при потвърждение на имейл!");
      } else {
        setMessage("✅ Имейлът е успешно потвърден! Можете да влезете с новия си адрес.");
        setTimeout(() => navigate("/login"), 3000);
      }
    }

    handleConfirmation();
  }, [navigate]);

  return (
    <div style={{ textAlign: "center", marginTop: "5rem" }}>
      <h2>{message}</h2>
    </div>
  );
}

export default EmailConfirm;
