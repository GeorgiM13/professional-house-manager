import HomeCard from "./HomeCard";
import Ruse from "./assets/Ruse.jpg";
import "./styles/Home.css";
import Header from "./components/Header";
import Footer from "./components/Footer";

function Home() {
  return (
    <div className="home-page">
      <Header />

      <div className="hero-section">
        <div className="hero-overlay"></div>
        <img className="hero-image" src={Ruse} alt="Русе - Панорама" />

        <div className="hero-content">
          <h1>Профи Дом - Русе</h1>
          <p>Професионално управление на етажната собственост.</p>
        </div>
      </div>

      <div className="content-container">
        <h2 className="section-title">Какви услуги предоставяме</h2>

        <div className="services-wrapper">
          <div className="main-card-row">
            <HomeCard
              icon={
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 21h18M5 21V7l8-4 8 4v14M8 21v-2a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2z"></path>
                </svg>
              }
              title="Професионален домоуправител"
              para="Цялостна услуга по управление на етажната собственост. Получавате спокойствието, че екип от специалисти се грижи за вашия вход, за да живеете в комфорт и чистота."
            />
          </div>

          <div className="small-cards-row">
            <HomeCard
              icon={
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                  <line x1="2" y1="10" x2="22" y2="10"></line>
                </svg>
              }
              title="Касиер"
              para="Събиране на месечни вноски и пълна отчетност. Навременно разплащане на сметки."
            />

            <HomeCard
              icon={
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 3l1.912 5.813a2 2 0 0 0 1.276 1.276L21 12l-5.813 1.912a2 2 0 0 0-1.276 1.276L12 21l-1.912-5.813a2 2 0 0 0-1.276-1.276L3 12l5.813-1.912a2 2 0 0 0 1.276-1.276L12 3z"></path>
                  <path d="M5 3v4"></path>
                  <path d="M7 5H3"></path>
                </svg>
              }
              title="Почистване"
              para="Професионално почистване на общи части. Входът ви ще блести от чистота."
            />

            <HomeCard
              icon={
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                </svg>
              }
              title="Техническа поддръжка"
              para="Редовни посещения и незабавна реакция при аварии и технически проблеми."
            />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default Home;
