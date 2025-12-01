import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import './styles/Login.css'
import Header from "./components/Header"
import Footer from "./components/Footer"

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();


  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const { data: userRecord, error: fetchError } = await supabase
        .from('users')
        .select('email')
        .eq('username', username)
        .maybeSingle();

      if (fetchError || !userRecord) {
        setError('Грешно потребителско име или парола');
        return;
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: userRecord.email,
        password: password
      });

      if (authError) {
        setError('Грешно потребителско име или парола');
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', authData.user.id)
        .maybeSingle();

      if (profileError) {
        setError('Грешка при връзка с базата данни.');
        return;
      }

      if (!profileData) {
        setError('Успешен вход, но липсва профил в системата. Свържете се с администратор.');
        console.error("Липсва запис в public.users за ID:", authData.user.id);
        return;
      }
      const sessionData = {
        ...profileData,
        access_token: authData.session.access_token,
      };

      localStorage.setItem('user', JSON.stringify(sessionData));

      if (profileData.role === 'admin') {
        navigate('/admin/adminevents');
      } else {
        navigate('/client/userevents');
      }

    } catch (err) {
      setError('Възникна неочаквана грешка');
      console.error(err);
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