import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import authService from '../../services/authService';

const LoginDrawer = ({ isOpen, onClose }) => {
  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'register'
  
  // Login State
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginMsg, setLoginMsg] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Register State
  const [regUser, setRegUser] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regMsg, setRegMsg] = useState('');
  const [regMsgType, setRegMsgType] = useState('error'); // 'error' or 'success'
  const [regLoading, setRegLoading] = useState(false);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginMsg('');
    try {
      await login(loginUser, loginPass);
      onClose();
    } catch (err) {
      console.error(err);
      setLoginMsg(err.response?.data?.message || 'Erro ao autenticar. Tente novamente.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegLoading(true);
    setRegMsg('');
    try {
      await authService.register(regUser, regEmail, regPass);
      setRegMsg('CONTA CRIADA! FAÇA LOGIN.');
      setRegMsgType('success');
      setRegUser('');
      setRegEmail('');
      setRegPass('');
      setTimeout(() => {
        setActiveTab('login');
        setRegMsg('');
      }, 1500);
    } catch (err) {
      console.error(err);
      setRegMsg(err.response?.data?.message || 'Erro ao registrar.');
      setRegMsgType('error');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <>
      <div className="drawer-overlay open" onClick={onClose}></div>
      <div className="login-drawer open" id="login-drawer">
        <div className="drawer-header">
          <h2>Identificação</h2>
          <button className="close-drawers icon-button" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="drawer-tabs">
          <button
            className={`drawer-tab-btn ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => setActiveTab('login')}
          >
            Entrar
          </button>
          <button
            className={`drawer-tab-btn ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => setActiveTab('register')}
          >
            Cadastrar
          </button>
        </div>
        <div className="drawer-body">
          {activeTab === 'login' ? (
            <div id="drawer-login-content">
              <form className="auth-form-drawer" onSubmit={handleLoginSubmit}>
                <label htmlFor="drawer-login-user">E-mail ou usuário</label>
                <input
                  type="text"
                  id="drawer-login-user"
                  required
                  placeholder="seu@email.com"
                  value={loginUser}
                  onChange={(e) => setLoginUser(e.target.value)}
                />
                <label htmlFor="drawer-login-pass">Senha</label>
                <input
                  type="password"
                  id="drawer-login-pass"
                  required
                  placeholder="••••••••"
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                />
                <button type="submit" className="button w-100 mb-3" disabled={loginLoading}>
                  {loginLoading ? 'AUTENTICANDO...' : 'ENTRAR'}
                </button>
                {loginMsg && (
                  <p className="text-danger small text-center" style={{ color: 'var(--color-error)', marginTop: '10px' }}>
                    {loginMsg}
                  </p>
                )}
              </form>
            </div>
          ) : (
            <div id="drawer-register-content">
              <form className="auth-form-drawer" onSubmit={handleRegisterSubmit}>
                <label htmlFor="drawer-reg-user">Nome de usuário</label>
                <input
                  type="text"
                  id="drawer-reg-user"
                  required
                  value={regUser}
                  onChange={(e) => setRegUser(e.target.value)}
                />
                <label htmlFor="drawer-reg-email">E-mail</label>
                <input
                  type="email"
                  id="drawer-reg-email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                />
                <label htmlFor="drawer-reg-pass">Senha</label>
                <input
                  type="password"
                  id="drawer-reg-pass"
                  required
                  value={regPass}
                  onChange={(e) => setRegPass(e.target.value)}
                />
                <button type="submit" className="button w-100 mb-3" disabled={regLoading}>
                  {regLoading ? 'CRIANDO CONTA...' : 'CRIAR CONTA'}
                </button>
                {regMsg && (
                  <p
                    className={`small text-center ${regMsgType === 'success' ? 'text-success' : 'text-danger'}`}
                    style={{
                      color: regMsgType === 'success' ? 'var(--color-success)' : 'var(--color-error)',
                      marginTop: '10px'
                    }}
                  >
                    {regMsg}
                  </p>
                )}
              </form>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default LoginDrawer;
