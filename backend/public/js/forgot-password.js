import { renderNav, renderFooter } from './ui.js';

const root = document.getElementById('page-root');

function renderStep1() {
  root.innerHTML = `
    ${renderNav('login')}
    <main class="content">
      <section class="box form-box">
        <h1>Recuperar Senha</h1>
        <p>Insira seu e-mail cadastrado para gerar o código de recuperação.</p>
        <form id="forgot-form" class="form-grid">
          <label>
            E-mail
            <input type="email" id="email" required />
          </label>
          <button type="submit" class="button">Gerar Código</button>
        </form>
        <p id="forgot-message" class="hint"></p>
        <p class="hint">Lembrou da senha? <a href="/login">Faça login</a>.</p>
      </section>
    </main>
    ${renderFooter()}
  `;

  document.getElementById('forgot-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const msg = document.getElementById('forgot-message');
    msg.textContent = '';

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        msg.textContent = data.message || 'Falha ao solicitar recuperação.';
        msg.className = 'field-error-msg';
        return;
      }

      msg.textContent = `Código gerado: ${data.token}. Redirecionando...`;
      msg.className = 'text-success';
      setTimeout(() => {
        renderStep2(email, data.token);
      }, 1500);
    } catch (err) {
      msg.textContent = 'Erro ao se conectar ao servidor.';
      msg.className = 'field-error-msg';
    }
  });
}

function renderStep2(email, defaultToken = '') {
  root.innerHTML = `
    ${renderNav('login')}
    <main class="content">
      <section class="box form-box">
        <h1>Nova Senha</h1>
        <p>Defina sua nova senha de acesso.</p>
        <form id="reset-form" class="form-grid">
          <label>
            Código de 6 dígitos
            <input type="text" id="token" value="${defaultToken}" maxLength="6" required />
          </label>
          <label>
            Nova Senha
            <input type="password" id="newPassword" required />
          </label>
          <button type="submit" class="button">Redefinir Senha</button>
        </form>
        <p id="reset-message" class="hint"></p>
      </section>
    </main>
    ${renderFooter()}
  `;

  document.getElementById('reset-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = document.getElementById('token').value.trim();
    const newPassword = document.getElementById('newPassword').value;
    const msg = document.getElementById('reset-message');
    msg.textContent = '';

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        msg.textContent = data.message || 'Erro ao redefinir a senha.';
        msg.className = 'field-error-msg';
        return;
      }

      msg.textContent = 'Senha atualizada com sucesso! Redirecionando para login...';
      msg.className = 'text-success';
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    } catch (err) {
      msg.textContent = 'Erro ao se conectar ao servidor.';
      msg.className = 'field-error-msg';
    }
  });
}

renderStep1();
