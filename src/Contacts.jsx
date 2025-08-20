import { useState } from "react"
import { supabase } from "./supabaseClient"
import "./styles/Contacts.css"
import Header from "./components/Header"
import Footer from "./components/footer"

function Contacts() {

    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        message: "",
    });

    const [loading, setLoading] = useState(false);

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

        <>
            <Header />
            <div className="contacts-page">
                <h1 className="page-title">Контакти</h1>

                <div className="contacts-wrapper">
                    <div className="contact-form">
                        <form onSubmit={handleSubmit}>
                            <h2 className="form-h">Контактна форма</h2>
                            <div className="form-row">
                                <div className="form-column">
                                    <label>Име</label>
                                    <input type="text" aria-label="Name"
                                        value={formData.first_name}
                                        onChange={(e) =>
                                            setFormData({ ...formData, first_name: e.target.value })
                                        }
                                        required
                                    />

                                    <label>Email</label>
                                    <input type="email" aria-label="Email"
                                        value={formData.email}
                                        onChange={(e) =>
                                            setFormData({ ...formData, email: e.target.value })
                                        }
                                    />
                                </div>

                                <div className="form-column">
                                    <label>Фамилия</label>
                                    <input type="text" aria-label="Last name"
                                        value={formData.last_name}
                                        onChange={(e) =>
                                            setFormData({ ...formData, last_name: e.target.value })
                                        }
                                    />

                                    <label>Телефонен номер</label>
                                    <input type="tel" aria-label="Phone number"
                                        value={formData.phone}
                                        onChange={(e) =>
                                            setFormData({ ...formData, phone: e.target.value })
                                        }
                                    />
                                </div>
                            </div>

                            <label>Съобщение</label>
                            <textarea aria-label="Message"
                                value={formData.message}
                                onChange={(e) =>
                                    setFormData({ ...formData, message: e.target.value })
                                } />

                            <button type="submit">Изпрати</button>
                        </form>
                    </div>

                    <div className="contacts-info">
                        <h2>За връзка</h2>
                        <p>📍 Русе, ул. Александровска 97</p>
                        <p>📞 Калоян Миланов - 0898 563 392</p>
                        <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d213.83856342687585!2d25.96011149305144!3d43.85464095397328!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40ae60cb89be8811%3A0xf9a09846d8d04e59!2sTerm!5e0!3m2!1sen!2sbg!4v1755092573476!5m2!1sen!2sbg"
                            style={{ border: 0 }}
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade">
                        </iframe>


                    </div>
                </div>
            </div>

            <Footer />

        </>
    );
}

export default Contacts;
