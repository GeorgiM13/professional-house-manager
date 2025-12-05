import { useState } from "react";
import { supabase } from "./supabaseClient";
import "./styles/Contacts.css";
import Header from "./components/Header";
import Footer from "./components/Footer";

const IconMapPin = (props) => (
  <svg
    {...props}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>
);
const IconPhone = (props) => (
  <svg
    {...props}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
  </svg>
);

function Contacts() {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("contact_messages").insert([
      {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        message: formData.message,
      },
    ]);

    setLoading(false);

    if (error) {
      alert("Грешка при изпращане на съобщението: " + error.message);
    } else {
      alert("Съобщението е изпратено успешно!");
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        message: "",
      });
    }
  }

  return (
    <div className="contacts-page-wrapper">
      <Header />
      <div className="contacts-content">
        <h1 className="page-title">Свържете се с нас</h1>

        <div className="contacts-wrapper">
          <div className="contact-card contact-form-card">
            <h2 className="form-h">Изпратете запитване</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-column">
                  <label htmlFor="first_name">Име</label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                  />

                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-column">
                  <label htmlFor="last_name">Фамилия</label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                  />

                  <label htmlFor="phone">Телефонен номер</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <label htmlFor="message">Съобщение</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
              />

              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? "Изпращане..." : "Изпрати съобщение"}
                {loading && <span className="spinner"></span>}
              </button>
            </form>
          </div>

          <div className="contact-card contacts-info-card">
            <h2 className="form-h">Данни за връзка</h2>

            <div className="info-list">
              <div className="info-item">
                <IconMapPin className="info-icon" />
                <div>
                  <h4>Адрес</h4>
                  <p>гр. Русе, ул. Александровска 97</p>
                </div>
              </div>

              <div className="info-item">
                <IconPhone className="info-icon" />
                <div>
                  <h4>Телефон</h4>
                  <p>
                    Калоян Миланов: <a href="tel:0898563392">0898 563 392</a>
                  </p>
                </div>
              </div>
            </div>

            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d179.81599359920315!2d25.959905100426113!3d43.85467008140394!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40ae60cb89be8811%3A0xf9a09846d8d04e59!2z0KLQldCg0Jwg0J7QntCU!5e0!3m2!1sbg!2sbg!4v1764605227858!5m2!1sbg!2sbg"
              width="600"
              height="450"
              style={{border:0}}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default Contacts;
