import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { supabase } from "../../supabaseClient"
import "./styles/Buildings.css"

function Buildings () {

    const navigate = useNavigate();
    const [buildings, setBuildings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBuildings();
    }, []);

    const fetchBuildings = async () => {
        const { data, error } = await supabase
            .from("buildings")
            .select("*")
            .order("name", { ascending: true });

            if (error) {
                console.error("Error fetching buildings:", error);
            } else {
                setBuildings(data);
            }
            setLoading(false);
    };

    function formatDateTime(dateString) {
        if (!dateString) return "";
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");

        return `${day}.${month}.${year} ${hours}:${minutes}`;
    }

    return (
        <div className="buildings-page">
            <div className="buildings-header">
                <h2>Сгради</h2>
                <Link to="/admin/addbuilding">
                    <button className="add-building-button">Добавяне на сграда</button>
                </Link>
            </div>

            {loading ? (
                <p>Зареждане...</p>
            ) : buildings.length === 0 ?(
                <p>Няма добавени сгради</p>
            ) : (
                <table className="buildings-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Име</th>
                            <th>Адрес</th>
                            <th>Етажи</th>
                            <th>Апартаменти</th>
                            <th>Гаражи</th>
                            <th>Дата на добавяне</th>
                        </tr>
                    </thead>
                    <tbody>
                        {buildings.map((b) => (
                            <tr key={b.id} onClick={() => navigate(`/admin/buildings/${b.id}/edit`)}>
                                <td>{b.id}</td>
                                <td>{b.name}</td>
                                <td>{b.address}</td>
                                <td>{b.floors}</td>
                                <td>{b.apartments}</td>
                                <td>{b.garages}</td>
                                <td>{formatDateTime(b.created_at)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )
        }
        </div>
    )


}

export default Buildings;