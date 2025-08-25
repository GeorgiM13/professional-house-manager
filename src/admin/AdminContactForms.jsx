import { useState, useEffect } from "react"
import { supabase } from "../supabaseClient"
import { useNavigate } from "react-router-dom"
import "./styles/AdminEvents.css"

function AdminContactForms() {
  const [messages, setMessages] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchMessages() {
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await supabase
        .from("contact_messages")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) {
        console.error("Supabase error:", error);
      } else {
        setMessages(data || []);
        setTotalCount(count || 0);
      }
    }

    fetchMessages();
  }, [currentPage, pageSize]);

  const totalPages = Math.ceil(totalCount / pageSize);

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
          <span>Съобщения, получени от контактна форма</span>
          <p>Преглед на всички съобщения</p>
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
              <td data-label="№">{idx + 1}</td>
              <td data-label="Име">{msg.first_name}</td>
              <td data-label="Фамилия">{msg.last_name}</td>
              <td data-label="Email">{msg.email}</td>
              <td data-label="Телефон">{msg.phone}</td>
              <td data-label="Съобщение" style={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "250px"
              }}>
                {msg.message}
              </td>
              <td data-label="Дата ма изпращане">{formatDateTime(msg.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(p => p - 1)}
        >
          ⬅ Предишна
        </button>
        <span>Страница {currentPage} от {totalPages}</span>
        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(p => p + 1)}
        >
          Следваща ➡
        </button>
      </div>
    </div>
  );
}

export default AdminContactForms;
