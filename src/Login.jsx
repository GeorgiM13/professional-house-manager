import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import './styles/Login.css'
import Header from "./components/Header"
import Footer from "./components/footer"


function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    const { data: userRecord, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .maybeSingle();

    if (fetchError || !userRecord) {
      setError('Потребителят не е намерен');
      return;
    }

    const email = userRecord.email;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      setError('Невалидна парола');
      return;
    }

    const sessionData = {
      id: userRecord.id,
      username: userRecord.username,
      role: userRecord.role,
      first_name: userRecord.first_name,
      last_name: userRecord.last_name,
      access_token: data.session.access_token,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000
    };

    localStorage.setItem('user', JSON.stringify(sessionData));
    console.log('Вход успешен', sessionData);


    if (sessionData.role === 'admin') {
      window.location.href = '/admin/adminevents';
    } else if (sessionData.role === 'user') {
      window.location.href = '/client/userevents';
    } else {
      navigate('/');
    }
  };

  return (
    <>

      <Header />

      <div className="login-container">
        <form onSubmit={handleLogin} className="login-form">
          <h2>Вход в системата</h2>
          <input
            type="text"
            placeholder="Потребителско име"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Парола"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Вход</button>
          {error && <p className="error">{error}</p>}
        </form>
      </div>

      <Footer />

    </>
  );
}

export default Login;