import documents from "./documents/documents.js"
import "./styles/Documents.css"

function Documents() {
  return (
    <div className="documents-page">
      <h1>Документи</h1>
      <div className="documents-grid">
        {documents.map((doc) => (
          <div key={doc.id} className="document-card">
            <a href={doc.link} target="_blank" rel="noopener noreferrer">
            <img src={doc.img} alt={doc.title} />
          </a>
            <h2>{doc.title}</h2>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Documents;
