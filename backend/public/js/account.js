import { renderNav, renderFooter } from './ui.js';

const root = document.getElementById('page-root');
root.innerHTML = `
  ${renderNav('account')}
  <main class="content">
    <section class="box">
      <h1>Minha Conta</h1>
      <p>Área do usuário com informações básicas e histórico de navegação.</p>
      <div class="card">
        <h2>Dados do usuário</h2>
        <p>Nome: Usuário exemplo</p>
        <p>E-mail: exemplo@dominio.com</p>
        <p>Tipo: usuário normal</p>
      </div>
      <div class="card">
        <h2>Atividades</h2>
        <p>Histórico de pedidos e status estarão disponíveis aqui.</p>
      </div>
    </section>
  </main>
  ${renderFooter()}
`;
