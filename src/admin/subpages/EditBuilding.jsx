import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import CustomAlert from "../../components/CustomAlert";
import ConfirmModal from "../../components/ConfirmModal";
import "./styles/EditBuilding.css";

function EditBuilding() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    floors: "",
    apartments: "",
    garages: "",
    offices: "",
  });

  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("info");
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBuilding();
  }, [id]);

  const fetchBuilding = async () => {
    const { data, error } = await supabase
      .from("buildings")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error loading building:", error);
      setAlertType("error");
      setAlertMessage("Грешка при зареждане на сградата! " + error.message);
    } else if (data) {
      setFormData({
        name: data.name || "",
        address: data.address || "",
        floors: data.floors || "",
        apartments: data.apartments || "",
        garages: data.garages || "",
        offices: data.offices || "",
      });
    }
    setLoading(false);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    const { name, address, floors, apartments, garages, offices } = formData;

    const payload = {
      name,
      address,
      floors: Number(floors) || 0,
      apartments: Number(apartments) || 0,
      garages: Number(garages) || 0,
      offices: Number(offices) || 0,
    };

    const { error } = await supabase
      .from("buildings")
      .update({
        name,
        address,
        floors: parseInt(floors),
        apartments: parseInt(apartments),
        garages: garages ? parseInt(garages) : 0,
        offices: offices ? parseInt(offices) : 0,
      })
      .eq("id", id);

    if (error) {
      console.error("Update error:", error);
      setAlertType("error");
      setAlertMessage("Грешка при редакция! " + error.message);
    } else {
      setAlertType("success");
      setAlertMessage("Сградата е успешно редактирана!");
      setTimeout(() => navigate("/admin/buildings"), 2500);
    }
  };

  const handleDeleteConfirmed = async () => {
    const { error } = await supabase.from("buildings").delete().eq("id", id);

    if (error) {
      setAlertType("error");
      setAlertMessage("Грешка при изтриване! " + error.message);
    } else {
      setAlertType("success");
      setAlertMessage("Сградата е изтрита успешно!");
      setTimeout(() => navigate("/admin/buildings"), 2000);
    }

    setShowConfirm(false);
  };

  return (
    <div className="edit-building-container">
      <h2>Редакция на сграда</h2>
      <form onSubmit={handleUpdate} className="edit-building-form">
        <label>
          Име на сградата:
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </label>

        <label>
          Адрес:
          <input
            type="text"
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
            required
          />
        </label>

        <label>
          Брой етажи:
          <input
            type="number"
            value={formData.floors}
            onChange={(e) =>
              setFormData({ ...formData, floors: e.target.value })
            }
            required
          />
        </label>

        <label>
          Брой апартаменти:
          <input
            type="number"
            value={formData.apartments}
            onChange={(e) =>
              setFormData({ ...formData, apartments: e.target.value })
            }
          />
        </label>

        <label>
          Брой гаражи:
          <input
            type="number"
            value={formData.garages}
            onChange={(e) =>
              setFormData({ ...formData, garages: e.target.value })
            }
          />
        </label>

        <label>
          Брой офиси:
          <input
            type="number"
            value={formData.offices}
            onChange={(e) =>
              setFormData({ ...formData, offices: e.target.value })
            }
          />
        </label>

        <div className="form-buttons">
          <button type="submit" className="btn primary">
            Запази
          </button>
          <button
            type="button"
            className="btn secondary"
            onClick={() => navigate(-1)}
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
          title="Изтриване на сграда"
          message="Наистина ли искате да изтриете тази сграда?"
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}

export default EditBuilding;
