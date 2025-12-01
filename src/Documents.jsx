import documents from "./documents/documents.js";
import "./styles/Documents.css";
import Header from "./components/Header";
import Footer from "./components/Footer";

function Documents() {
  return (
    <div className="documents-page-wrapper">
      <Header />
      
      <div className="documents-content">
        <h1 className="documents-title">Полезни Документи</h1>
        <p className="documents-subtitle">Тук можете да намерите и изтеглите важни бланки и документи.</p>

        <div className="documents-grid">
          {documents.map((doc) => (
            <div key={doc.id} className="document-card">
              <a href={doc.link} target="_blank" rel="noopener noreferrer" className="doc-link-wrapper">
                
                <div className="doc-image-container">
                  <img src={doc.img} alt={doc.title} className="doc-image" />
                </div>

                <div className="doc-info">
                  <h2>{doc.title}</h2>
                  <span className="view-btn">
                    Преглед
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                      <polyline points="15 3 21 3 21 9"></polyline>
                      <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                  </span>
                </div>

              </a>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default Documents;