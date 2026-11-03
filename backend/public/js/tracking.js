import { renderNav, renderFooter, initDrawerEvents, updateCartBadge } from './ui.js?v=2';

const root = document.getElementById('page-root');

function getStatusStepIndex(status) {
  switch (status) {
    case 'pending':
      return 1;
    case 'paid':
    case 'processing':
      return 2;
    case 'shipped':
      return 3;
    case 'delivered':
      return 4;
    case 'canceled':
      return -1;
    default:
      return 1;
  }
}

function getStatusBadge(status) {
  switch (status) {
    case 'pending':
      return '<span class="tracking-badge badge-pending"><i class="fas fa-clock"></i> Aguardando Pagamento</span>';
    case 'paid':
      return '<span class="tracking-badge badge-paid"><i class="fas fa-check-circle"></i> Pagamento Aprovado</span>';
    case 'processing':
      return '<span class="tracking-badge badge-processing"><i class="fas fa-box-open"></i> Em Separação</span>';
    case 'shipped':
      return '<span class="tracking-badge badge-shipped"><i class="fas fa-shipping-fast"></i> Em Trânsito</span>';
    case 'delivered':
      return '<span class="tracking-badge badge-delivered"><i class="fas fa-check-double"></i> Entregue</span>';
    case 'canceled':
      return '<span class="tracking-badge badge-canceled"><i class="fas fa-times-circle"></i> Cancelado</span>';
    default:
      return `<span class="tracking-badge">${status}</span>`;
  }
}

function renderTimeline(currentStep) {
  const steps = [
    { title: 'Pedido Recebido', desc: 'Registrado no sistema' },
    { title: 'Em Separação', desc: 'Embalando peças' },
    { title: 'Despachado', desc: 'Em trânsito' },
    { title: 'Entregue', desc: 'Chegou no destino' },
  ];

  return `
    <div class="tracking-timeline-container">
      <div class="tracking-timeline-bar">
        <div class="tracking-timeline-progress" style="width: ${Math.max(0, Math.min(100, (currentStep / (steps.length - 1)) * 100))}%;"></div>
      </div>
      <div class="tracking-steps-grid">
        ${steps.map((s, idx) => {
          const isDone = idx < currentStep;
          const isCurrent = idx === currentStep;
          return `
            <div class="tracking-step-item ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}">
              <div class="step-circle">
                ${isDone ? '<i class="fas fa-check"></i>' : (idx + 1)}
              </div>
              <div class="step-title">${s.title}</div>
              <div class="step-desc">${s.desc}</div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderTrackingDetails(data) {
  const stepIdx = getStatusStepIndex(data.status);
  const events = data.trackingEvents || [];
  const latestEvent = events.length > 0 ? events[events.length - 1] : null;

  const eventsHtml = events.slice().reverse().map(ev => `
    <div class="checkpoint-item">
      <div class="checkpoint-date">
        <strong>${new Date(ev.date).toLocaleDateString('pt-BR')}</strong>
        <span>${new Date(ev.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
      <div class="checkpoint-marker">
        <span class="checkpoint-dot"></span>
      </div>
      <div class="checkpoint-content">
        <h4>${ev.description}</h4>
        <p><i class="fas fa-map-marker-alt"></i> ${ev.location || 'Centro Logístico'}</p>
      </div>
    </div>
  `).join('');

  const itemsHtml = (data.items || []).map(i => `
    <div class="tracking-item-row">
      <div class="item-name">
        <strong>${i.name}</strong>
        <span class="item-meta">Tam: ${i.size || 'Único'} | Cor: ${i.color || 'Padrão'}</span>
      </div>
      <div class="item-qty">Qtd: ${i.quantity}</div>
    </div>
  `).join('');

  const cleanPhone = '5571999313160';
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(`Olá! Gostaria de receber atualizações do meu pedido #${data.shortId} (Rastreio: ${data.trackingCode || 'N/A'})`)}`;

  return `
    <div class="tracking-result-box">
      <!-- Top Order Bar -->
      <div class="tracking-header-row">
        <div>
          <span class="tracking-sublabel">PEDIDO</span>
          <h2 class="tracking-order-number">#${data.shortId}</h2>
        </div>
        <div class="tracking-status-wrap">
          ${getStatusBadge(data.status)}
        </div>
      </div>

      <!-- Timeline Bar -->
      ${renderTimeline(stepIdx)}

      <!-- Live Location Card -->
      <div class="tracking-live-card">
        <div class="live-icon">
          <i class="fas fa-truck-moving fa-2x"></i>
        </div>
        <div class="live-info">
          <h3>${latestEvent ? latestEvent.description : 'Pacote em preparação para envio'}</h3>
          <p><i class="fas fa-map-pin"></i> Localização atual: <strong>${latestEvent ? latestEvent.location : 'Sombrio/SC - Centro de Distribuição MD'}</strong></p>
          <div class="carrier-tags">
            <span class="carrier-tag"><i class="fas fa-box"></i> Transportadora: <strong>${data.carrier || 'Correios'}</strong></span>
            ${data.trackingCode ? `<span class="carrier-tag"><i class="fas fa-barcode"></i> Rastreio: <strong>${data.trackingCode}</strong></span>` : ''}
            ${data.destinationCity ? `<span class="carrier-tag"><i class="fas fa-home"></i> Destino: <strong>${data.destinationCity}/${data.destinationState}</strong></span>` : ''}
          </div>
        </div>
      </div>

      <!-- Grid: Checkpoints + Order Items -->
      <div class="tracking-grid-columns">
        <!-- Checkpoints Timeline -->
        <div class="tracking-panel">
          <h3><i class="fas fa-history"></i> Histórico de Movimentação</h3>
          <div class="checkpoints-list">
            ${eventsHtml.length > 0 ? eventsHtml : '<p class="text-muted">Aguardando primeiras atualizações da transportadora.</p>'}
          </div>
        </div>

        <!-- Package Items & WhatsApp Bot -->
        <div class="tracking-panel">
          <h3><i class="fas fa-tshirt"></i> Itens do Pacote</h3>
          <div class="tracking-items-list">
            ${itemsHtml}
          </div>

          <div class="tracking-whatsapp-alert">
            <h4><i class="fab fa-whatsapp" style="color: #25D366;"></i> Alertas Automáticos</h4>
            <p>Quer receber cada movimentação deste pacote direto no seu WhatsApp?</p>
            <a href="${whatsappUrl}" target="_blank" class="button w-100 button-whatsapp">
              <i class="fab fa-whatsapp"></i> ATIVAR ALERTAS NO WHATSAPP
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function searchTracking(code) {
  const resultContainer = document.getElementById('tracking-result-container');
  if (!resultContainer) return;

  if (!code || !code.trim()) {
    resultContainer.innerHTML = `
      <div class="tracking-empty-alert">
        <p>Por favor, informe o código de rastreamento ou número do seu pedido.</p>
      </div>
    `;
    return;
  }

  resultContainer.innerHTML = `
    <div class="tracking-loading">
      <i class="fas fa-circle-notch fa-spin fa-3x"></i>
      <p>Localizando pacote nos Correios e transportadoras parceiras...</p>
    </div>
  `;

  try {
    const res = await fetch(`/api/orders/track/${encodeURIComponent(code.trim())}`);
    if (!res.ok) {
      const err = await res.json();
      resultContainer.innerHTML = `
        <div class="tracking-error-card">
          <i class="fas fa-search fa-3x" style="color: #6c757d; margin-bottom: 16px;"></i>
          <h3>Pedido Não Localizado</h3>
          <p>${err.message || 'Verifique se digitou o código de rastreio ou número do pedido corretamente.'}</p>
          <div style="margin-top: 16px;">
            <span style="font-size: 0.85rem; color: #888;">Dica: você encontra o código no e-mail de confirmação ou no seu painel de conta.</span>
          </div>
        </div>
      `;
      return;
    }

    const data = await res.json();
    resultContainer.innerHTML = renderTrackingDetails(data);
  } catch (err) {
    resultContainer.innerHTML = `
      <div class="tracking-error-card">
        <p>Erro de comunicação com o servidor de rastreamento. Tente novamente em instantes.</p>
      </div>
    `;
  }
}

async function renderTrackingPage() {
  const params = new URLSearchParams(window.location.search);
  const initialCode = params.get('code') || '';

  root.innerHTML = `
    ${renderNav('tracking')}
    <main class="content">
      <section class="tracking-hero">
        <div class="container-custom">
          <p class="tracking-eyebrow">SISTEMA INTEGRADO DE LOGÍSTICA</p>
          <h1 class="tracking-title">RASTREIE SEU PEDIDO EM TEMPO REAL</h1>
          <p class="tracking-subtitle">Acompanhe a rota exata da sua encomenda, com atualizações automáticas dos Correios e transportadoras parceiras.</p>

          <form id="tracking-search-form" class="tracking-search-form" onsubmit="event.preventDefault();">
            <div class="tracking-input-group">
              <i class="fas fa-search search-icon"></i>
              <input type="text" id="tracking-input" placeholder="Digite o código de rastreio (ex: MD123456789BR) ou número do pedido" value="${initialCode}" />
              <button type="submit" id="tracking-search-btn" class="button">RASTREAR</button>
            </div>
          </form>

          <div class="tracking-badges-row">
            <span><i class="fas fa-shield-alt"></i> Rastreio 100% Seguro</span>
            <span><i class="fas fa-bolt"></i> Atualização em Tempo Real</span>
            <span><i class="fas fa-bell"></i> Notificações por E-mail & WhatsApp</span>
          </div>
        </div>
      </section>

      <section class="container-custom py-5">
        <div id="tracking-result-container"></div>
      </section>
    </main>
    ${renderFooter()}
  `;

  initDrawerEvents();
  updateCartBadge();

  const form = document.getElementById('tracking-search-form');
  const input = document.getElementById('tracking-input');

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = input.value.trim();
    if (val) {
      const newUrl = new URL(window.location);
      newUrl.searchParams.set('code', val);
      window.history.pushState({}, '', newUrl);
      searchTracking(val);
    }
  });

  if (initialCode) {
    searchTracking(initialCode);
  }
}

renderTrackingPage();
