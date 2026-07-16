import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../../services/authService';

const Register = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [msgType, setMsgType] = useState('error'); // 'error' or 'success'
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await authService.register(username, email, password);
      setMessage('Cadastro realizado com sucesso! Redirecionando para login...');
      setMsgType('success');
      setTimeout(() => {
        navigate('/login');
      }, 1200);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || 'Erro ao registrar.');
      setMsgType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="content">
      <section className="box form-box" style={{ maxWidth: '450px', margin: '40px auto', padding: '40px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px' }}>Cadastro</h1>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>
          Preencha o formulário para criar sua conta.
        </p>
        <form onSubmit={handleSubmit} className="form-grid" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontWeight: 600 }}>
            Usuário
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nome de usuário"
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontWeight: 600 }}>
            E-mail
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              placeholder="Sua senha"
            />
          </label>
          <button type="submit" className="button" disabled={loading} style={{ marginTop: '8px' }}>
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </form>
        {message && (
          <p
            className={`hint ${msgType === 'success' ? 'text-success' : 'text-danger'}`}
            style={{
              color: msgType === 'success' ? 'var(--color-success)' : 'var(--color-error)',
              marginTop: '16px',
              textAlign: 'center'
            }}
          >
            {message}
          </p>
        )}
        <p className="hint" style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
          Já tem conta?{' '}
          <Link to="/login" style={{ textDecoration: 'underline', fontWeight: 600, color: 'var(--color-black)' }}>
            Faça login
          </Link>
          .
        </p>
      </section>
    </main>
  );
};

export default Register;
