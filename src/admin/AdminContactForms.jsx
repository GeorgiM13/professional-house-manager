import { useState, useEffect } from "react"
import { supabase } from "../supabaseClient"
import { useNavigate } from "react-router-dom"
import "./styles/AdminEvents.css"

function AdminContactForms() {
  const [messages, setMessages] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchMessages() {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase error:", error);
      } else {
        setMessages(data || []);
      }
    }

    fetchMessages();
  }, []);

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
    <div className="events-page">
      <div className="events-header">
        <h1>Съобщения от контактната форма</h1>
      </div>

      <div className="events-subheader">
        <div className="left">
          <span>Преглед на всички съобщения, получени чрез контактната форма</span>
        </div>
      </div>

      <table className="events-table">
        <thead>
          <tr>
            <th>№</th>
            <th>Име</th>
            <th>Фамилия</th>
            <th>Email</th>
            <th>Телефон</th>
            <th>Съобщение</th>
            <th>Дата на изпращане</th>
          </tr>
        </thead>
        <tbody>
          {messages.map((msg, idx) => (
            <tr key={msg.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/admin/message/${msg.id}`)}>
              <td>{idx + 1}</td>
              <td>{msg.first_name}</td>
              <td>{msg.last_name}</td>
              <td>{msg.email}</td>
              <td>{msg.phone}</td>
              <td style={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "200px"
              }}>
                {msg.message}
              </td>
              <td>{formatDateTime(msg.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  );
}

export default AdminContactForms;
