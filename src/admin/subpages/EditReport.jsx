import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "../../supabaseClient"
import CustomAlert from "../../components/CustomAlert"
import ConfirmModal from "../../components/ConfirmModal"
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

  const [loading, setLoading] = useState(true);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("info");
  const [showConfirm, setShowConfirm] = useState(false);

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

    fetchReport();
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
      setAlertType("error");
      setAlertMessage("Грешка при запазване! " + error.message);
    } else {
      setAlertType("success");
      setAlertMessage("Сигналът е обновен успешно!");
      setTimeout(() => navigate(`/admin/reports`), 3000);
    }
  }

  async function handleDeleteConfirmed() {
    const { error } = await supabase
      .from("reports")
      .delete()
      .eq("id", id);

    if (error) {
      setAlertType("error");
      setAlertMessage("Грешка при изтриване! " + error.message);
    } else {
      setAlertType("success");
      setAlertMessage("Сигналът е изтрит успешно!");
      setTimeout(() => navigate(`/admin/reports`), 3000);
    }

    setShowConfirm(false);
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
            onClick={() => setShowConfirm(true)}
          >
            Изтрий
          </button>
        </div>
      </form>
      <CustomAlert
        message={alertMessage}
        type={alertType}
        onClose={() => setAlertMessage("")}
      />
      {showConfirm && (
        <ConfirmModal
          title="Изтриване на събитие"
          message="Наистина ли искате да изтриете това събитие?"
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}

export default EditReport;
