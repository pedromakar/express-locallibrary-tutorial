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

    registerMessage.textContent = 'Cadastro realizado com sucesso. Faça login.';
    registerMessage.classList.add('success');
    registerForm.reset();
    setTimeout(() => {
      window.location.href = '/login';
    }, 1200);
  } catch (err) {
    registerMessage.textContent = 'Erro ao conectar com o servidor.';
  }
});
