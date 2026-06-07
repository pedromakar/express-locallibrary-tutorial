import { renderNav, renderFooter } from './ui.js';

const root = document.getElementById('page-root');
root.innerHTML = `
  ${renderNav('login')}
  <main class="content">
    <section class="box form-box">
      <h1>Cadastro</h1>
      <p>Preencha o formulário para criar sua conta.</p>
      <form id="register-form" class="form-grid">
        <label>
          Usuário
          <input type="text" id="username" required />
        </label>
        <label>
          E-mail
          <input type="email" id="email" required />
        </label>
        <label>
          Senha
          <input type="password" id="password" required />
        </label>
        <button type="submit" class="button">Cadastrar</button>
      </form>
      <p id="register-message" class="hint"></p>
      <p class="hint">Já tem conta? <a href="/login">Faça login</a>.</p>
    </section>
  </main>
  ${renderFooter()}
`;

const registerForm = document.getElementById('register-form');
const registerMessage = document.getElementById('register-message');

registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  registerMessage.textContent = '';

  const username = document.getElementById('username').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      registerMessage.textContent = data.message || 'Falha no cadastro.';
      return;
    }

    registerMessage.textContent = 'Cadastro realizado com sucesso! Redirecionando para login...';
    setTimeout(() => {
      window.location.href = '/login';
    }, 1200);
  } catch (error) {
    registerMessage.textContent = 'Erro ao conectar com o servidor.';
  }
});
