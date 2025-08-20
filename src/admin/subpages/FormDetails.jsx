import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "../../supabaseClient"
import "./styles/FormDetails.css"

function FormDetails() {

  const { id } = useParams();
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchMessage() {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Supabase error:", error);
      } else {
        setMessage(data);
      }
    }

    fetchMessage();
  }, [id]);

  if (!message) return <p>Зареждане...</p>;

  function formatDateTime(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${day}.${month}.${year} ${hours}:${minutes}`;
  }


  return (
    <div className="message-detail-page">
      <button onClick={() => navigate(-1)}>← Назад към списъка</button>
      <h2>Подробно съобщение</h2>
      <p><strong>Име:</strong> {message.first_name}</p>
      <p><strong>Фамилия:</strong> {message.last_name}</p>
      <p><strong>Email:</strong> {message.email}</p>
      <p><strong>Телефон:</strong> {message.phone}</p>
      <p><strong>Съобщение:</strong> {message.message}</p>
      <p><strong>Дата на изпращане:</strong> {formatDateTime(message.created_at)}</p>
    </div>
  );

}

export default FormDetails;