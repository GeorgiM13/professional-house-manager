function Login() {
    return (
        <div style={{ padding: "20px" }}>
            <h2>Вход за клиенти</h2>
            <form>
                <input type="text" placeholder="Потребителско име" /><br />
                <input type="password" placeholder="Парола" /><br />
                <button type="submit">Вход</button>
            </form>
        </div>
    );
}

export default Login;
