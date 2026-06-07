const loginForm = document.getElementById('login-form');
const loginMessage = document.getElementById('login-message');

loginForm.addEventListener('submit', async event => {
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
      loginMessage.textContent = data.message || 'Falha no login';
      return;
    }

    localStorage.setItem('md-essential-admin-token', data.token);
    if (data.role === 'admin') {
      window.location.href = '/admin';
    } else {
      window.location.href = '/profile';
    }
  } catch (err) {
    loginMessage.textContent = 'Erro ao conectar com o servidor.';
  }
});
