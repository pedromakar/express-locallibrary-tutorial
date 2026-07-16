import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Login = () => {
  const { login, token, user } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (token && user) {
      if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/account', { replace: true });
      }
    }
  }, [token, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const loggedUser = await login(username, password);
      if (loggedUser.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/account');
      }
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || 'Falha no login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="content">
      <section className="box form-box" style={{ maxWidth: '450px', margin: '40px auto', padding: '40px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px' }}>Login</h1>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>
          Use o formulário para entrar ou cadastrar caso não possua conta.
        </p>
        <form onSubmit={handleSubmit} className="form-grid" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontWeight: 600 }}>
            Usuário ou e-mail
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="seu@email.com"
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontWeight: 600 }}>
            Senha
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>
          <button type="submit" className="button" disabled={loading} style={{ marginTop: '8px' }}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        {message && (
          <p className="hint text-danger" style={{ color: 'var(--color-error)', marginTop: '16px', textAlign: 'center' }}>
            {message}
          </p>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', fontSize: '0.85rem' }}>
          <Link to="/forgot-password" style={{ textDecoration: 'underline', color: 'var(--color-text-muted)' }}>
            Esqueceu sua senha?
          </Link>
          <span style={{ color: 'var(--color-text-muted)' }}>
            Ainda não tem conta?{' '}
            <Link to="/register" style={{ textDecoration: 'underline', fontWeight: 600, color: 'var(--color-black)' }}>
              Cadastre-se
            </Link>
          </span>
        </div>
      </section>
    </main>
  );
};

export default Login;
