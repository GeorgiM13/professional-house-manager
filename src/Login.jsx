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
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();


  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

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

      setTimeout(() => {
        if (profileData.role === 'admin') {
          navigate('/admin/adminevents');
        } else {
          navigate('/client/userevents');
        }
      }, 500);

    } catch (err) {
      setError('Възникна неочаквана грешка');
      console.error(err);
    }
  };

  return (
    <div className="login-page-wrapper">
      <Header />
      
      <div className="login-main-area">

        <div className="login-glass-card">
          <div className="login-header">
            <h2>Добре дошли</h2>
            <p>Влезте във вашия профил за управление</p>
          </div>

          <form onSubmit={handleLogin} className="modern-form">
            
            <div className="input-group">
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder=" "
              />
              <label htmlFor="username">Потребителско име</label>
              <div className="input-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
            </div>

            <div className="input-group">
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder=" "
              />
              <label htmlFor="password">Парола</label>
              <div className="input-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
            </div>

            {error && (
              <div className="error-message-animated">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                {error}
              </div>
            )}

            <button type="submit" className={`login-btn ${loading ? 'loading' : ''}`} disabled={loading}>
              {loading ? (
                <span className="spinner"></span>
              ) : (
                <>
                  Вход <span className="arrow"></span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

export default Login;