import "./styles/Home.css";

function HomeCard({ title, para, icon }) {
  return (
    <div className="service-card">
      {icon && <div className="icon-wrapper">{icon}</div>}
      <h3>{title}</h3>
      <p>{para}</p>
    </div>
  );
}

export default HomeCard;