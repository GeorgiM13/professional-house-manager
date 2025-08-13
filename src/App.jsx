import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Header from "./components/Header"
import Footer from "./components/footer"
import Home from "./Home"
import ForUs from "./ForUs"
import Documents from "./Documents"
import Contacts from "./Contacts"
import Login from "./Login"
import "./App.css"

function App() {
    return (
        <Router>
            <div className="app-container">
                <Header />
                <main className="main-content">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/for-us" element={<ForUs />} />
                        <Route path="/documents" element={<Documents />} />
                        <Route path="/contacts" element={<Contacts />} />
                        <Route path="/login" element={<Login />} />
                    </Routes>
                </main>
                <Footer />
            </div>
        </Router>
    );
}

export default App;
