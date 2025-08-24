import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "../../supabaseClient"
import "./styles/EditReport.css"

function EditReport() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    status: "",
    subject: "",
    description: "",
    notes: ""
  });

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReport() {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("id", id)
        .single();

      if (!error && data) {
        setFormData({
          status: data.status || "",
          subject: data.subject || "",
          description: data.description || "",
          notes: data.notes || ""
        });
      }
      setLoading(false);
    }

    async function fetchUsers() {
      const { data, error } = await supabase
        .from("users")
        .select("id, first_name, last_name, role");

      if (!error) {
        setUsers((data || []).filter((u) => u.role === "admin"));
      }
    }

    fetchReport();
    fetchUsers();
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();

    const updateData = {
      status: formData.status,
      subject: formData.subject,
      description: formData.description,
      notes: formData.notes
    };

    const { error } = await supabase
      .from("reports")
      .update(updateData)
      .eq("id", Number(id));

    if (error) {
      alert("Грешка при запазване! " + error.message);
    } else {
      alert("Сигналът е обновен успешно!");
      navigate(`/admin/reports`);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Наистина ли искате да изтриете този сигнал?")) return;

    const { error } = await supabase
      .from("reports")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Грешка при изтриване! " + error.message);
    } else {
      alert("Сигналът е изтрит успешно!");
      navigate("/admin/adminreports");
    }
  }

  if (loading) return <p className="loading-text">Зареждане...</p>;

  return (
    <div className="edit-report-container">
      <h1 className="page-title">Редакция на сигнал</h1>
      <form onSubmit={handleSubmit} className="report-form">

        <label>Състояние</label>
        <select
          value={formData.status}
          onChange={(e) =>
            setFormData({ ...formData, status: e.target.value })
          }
        >
          <option value="ново">ново</option>
          <option value="изпълнено">изпълнено</option>
        </select>

        <label>Относно</label>
        <input
          type="text"
          value={formData.subject}
          onChange={(e) =>
            setFormData({ ...formData, subject: e.target.value })
          }
        />

        <label>Описание</label>
        <textarea
          type="text"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
        />

        <label>Допълнителни бележки</label>
        <textarea
          type="text"
          value={formData.notes}
          onChange={(e) =>
            setFormData({ ...formData, notes: e.target.value })
          }
        />

        <div className="form-buttons">
          <button type="submit" className="btn primary">
            Запази
          </button>
          <button
            type="button"
            className="btn secondary"
            onClick={() => navigate(-2)}
          >
            Отказ
          </button>
          <button
            type="button"
            className="btn danger"
            onClick={handleDelete}
          >
            Изтрий
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditReport;
