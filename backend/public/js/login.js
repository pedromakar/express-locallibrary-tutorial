import { renderNav, renderFooter } from './ui.js';

const root = document.getElementById('page-root');
root.innerHTML = `
  ${renderNav('login')}
  <main class="content">
    <section class="box form-box">
      <h1>Login</h1>
      <p>Use o formulário para entrar ou cadastrar caso não possua conta.</p>
      <form id="login-form" class="form-grid">
        <label>
          Usuário ou e-mail
          <input type="text" id="username" required />
        </label>
        <label>
          Senha
          <input type="password" id="password" required />
        </label>
        <button type="submit" class="button">Entrar</button>
      </form>
      <p id="login-message" class="hint"></p>
      <div style="display: flex; justify-content: space-between; margin-top: 16px; font-size: 0.85rem;">
        <a href="/forgot-password" style="text-decoration: underline;">Esqueceu sua senha?</a>
        <span>Ainda não tem conta? <a href="/register" style="text-decoration: underline;">Cadastre-se</a></span>
      </div>
    </section>
  </main>
  ${renderFooter()}
`;

const loginForm = document.getElementById('login-form');
const loginMessage = document.getElementById('login-message');

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginMessage.textContent = '';

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      loginMessage.textContent = data.message || 'Falha no login. Verifique suas credenciais.';
      return;
    }

    localStorage.setItem('md-essential-admin-token', data.token);
    if (data.role === 'admin') {
      window.location.href = '/admin';
    } else {
      window.location.href = '/account';
    }
  } catch (error) {
    loginMessage.textContent = 'Erro ao conectar com o servidor.';
  }
});
