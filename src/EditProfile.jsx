import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "./supabaseClient"
import "./styles/EditProfile.css"

function EditProfile() {
    const navigate = useNavigate();

    const [savedUser, setSavedUser] = useState(() => {
        return JSON.parse(localStorage.getItem("user")) || {};
    })
    const [userData, setUserData] = useState(() => {
        return JSON.parse(localStorage.getItem(`userData_${savedUser.id}`)) || null;
    });
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");

    useEffect(() => {
        async function fetchUserData() {
            if (!savedUser?.id) return;

            const cachedData = JSON.parse(localStorage.getItem(`userData_${savedUser.id}`));
            if (cachedData) {
                setUserData(cachedData);
                setUsername(cachedData.username || "");
                setPhone(cachedData.phone || "");
                return;
            }

            const { data, error } = await supabase
                .from("users")
                .select("*")
                .eq("id", savedUser.id)
                .single();

            if (error) {
                console.error("Supabase fetch error:", error);
            } else if (data) {
                setUserData(data);
                setUsername(data.username || "");
                setPhone(data.phone || "");
            }
        }

        fetchUserData();
    }, [savedUser]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password && password !== confirmPassword) {
            setMessage("Паролите не съвпадат");
            return;
        }

        if (password) {
            const { error: authError } = await supabase.auth.updateUser({ password });
            if (authError) {
                setMessage("Грешка при обновяване на паролата!");
                return;
            }
        }


        const updates = {};

        if (username !== userData.username) updates.username = username;
        if (phone !== userData.phone) updates.phone = phone;
        if (password) updates.password_hash = password;

        if (Object.keys(updates).length === 0) {
            setMessage("Няма промени за записване");
            return;
        }

        const { data, error } = await supabase
            .from("users")
            .update(updates)
            .eq("id", savedUser.id);

        if (error) {
            console.error("Supabase update error:", error);
            setMessage("Грешка при запис в базата!");
            return;
        }


        const updatedUser = {
            ...savedUser,
            ...updates
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        localStorage.setItem(`userData_${savedUser.id}`, JSON.stringify({ ...userData, ...updates }));

        setMessage("Данните са успешно обновени")

        setTimeout(() => {
            navigate(-1);
        }, 2000);


    };


    const handleCancel = () => {
        navigate(-1);
    }

    return (
        <div className="edit-profile-container">
            <h2>Промяна на данни</h2>
            <form onSubmit={handleSubmit} className="edit-profile-form">
                <label>
                    Три имена:
                    <input type="text" value={`${userData?.first_name} ${userData?.second_name} ${userData?.last_name}`} readOnly />
                </label>
                <label>
                    Потребителско име:
                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
                </label>
                <label>
                    Телефон:
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </label>
                <label>
                    Нова парола:
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </label>
                <label>
                    Потвърди паролата:
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </label>
                <div className="form-actions">
                    <button type="submit" className="save-button">Запази</button>
                    <button type="button" className="cancel-button" onClick={handleCancel}>Отказ</button>
                </div>
            </form>

            {message && <p className="succes-message">{message}</p>}


        </div>
    );



}

export default EditProfile;