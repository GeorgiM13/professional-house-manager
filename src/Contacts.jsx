import "./styles/Contacts.css";

function Contacts() {
    return (
        <div className="contacts-page">
            <h1 className="page-title">Контакти</h1>

            <div className="contacts-wrapper">
                <div className="contact-form">
                    <form>
                        <h2 className="form-h">Контактна форма</h2>
                        <div className="form-row">
                            <div className="form-column">
                                <label>Име</label>
                                <input type="text" aria-label="Name" />

                                <label>Email</label>
                                <input type="email" aria-label="Email" />
                            </div>

                            <div className="form-column">
                                <label>Фамилия</label>
                                <input type="text" aria-label="Last name" />

                                <label>Телефонен номер</label>
                                <input type="tel" aria-label="Phone number" />
                            </div>
                        </div>

                        <label>Съобщение</label>
                        <textarea aria-label="Message"></textarea>

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
    );
}

export default Contacts;
