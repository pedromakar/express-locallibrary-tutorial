const nodemailer = require('nodemailer');

let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Modo Simulação / Desenvolvimento elegante
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'mdessential.notify@ethereal.email',
        pass: 'virtual_dev_pass',
      },
    });
  }

  return transporter;
}

/**
 * Envia e-mail de Confirmação de Pedido
 */
exports.sendOrderConfirmationEmail = async ({ order, user }) => {
  try {
    const toEmail = order.customerEmail || user?.email;
    if (!toEmail) return null;

    const shortId = order._id.toString().slice(-6).toUpperCase();
    const trackingUrl = `${process.env.APP_URL || 'http://localhost:5001'}/tracking.html?code=${order._id}`;

    const itemsHtml = order.items.map(i => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
          <strong>${i.name}</strong><br>
          <span style="font-size: 12px; color: #666;">Tamanho: ${i.size || 'Único'} | Cor: ${i.color || 'Padrão'} | Qtd: ${i.quantity}</span>
        </td>
        <td style="padding: 10px 0; text-align: right; border-bottom: 1px solid #eee;">
          R$ ${(i.price * i.quantity).toFixed(2)}
        </td>
      </tr>
    `).join('');

    const html = `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background: #111111; color: #ffffff; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; letter-spacing: 2px;">MD ESSENTIAL</h1>
          <p style="margin: 6px 0 0; font-size: 12px; letter-spacing: 1px; color: #aaaaaa;">HIGH PERFORMANCE APPAREL</p>
        </div>
        
        <div style="padding: 30px;">
          <h2 style="font-size: 20px; color: #111111; margin-top: 0;">Pedido Confirmado! 🎉</h2>
          <p style="color: #444; font-size: 15px; line-height: 1.5;">
            Olá, <strong>${order.shippingAddress?.recipientName || user?.username || 'Cliente'}</strong>!<br>
            Recebemos o seu pedido <strong>#${shortId}</strong> e nossa equipe já está preparando cada peça com máxima atenção.
          </p>

          <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
            <thead>
              <tr style="border-bottom: 2px solid #111; text-align: left; font-size: 13px;">
                <th style="padding-bottom: 8px;">PRODUTO</th>
                <th style="padding-bottom: 8px; text-align: right;">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="text-align: right; font-size: 16px; margin-bottom: 30px;">
            <p style="margin: 4px 0; color: #666; font-size: 14px;">Frete: R$ ${(order.shippingPrice || 0).toFixed(2)}</p>
            <p style="margin: 8px 0; font-weight: bold; font-size: 18px; color: #111;">Total: R$ ${order.totalPrice.toFixed(2)}</p>
          </div>

          <div style="text-align: center; margin: 35px 0;">
            <a href="${trackingUrl}" style="background: #111111; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: bold; font-size: 14px; border-radius: 6px; display: inline-block;">
              ACOMPANHAR MEU PEDIDO →
            </a>
          </div>

          <div style="background: #f8f9fa; border-radius: 6px; padding: 16px; font-size: 13px; color: #555;">
            <strong>Endereço de Entrega:</strong><br>
            ${order.shippingAddress?.street ? `${order.shippingAddress.street}, ${order.shippingAddress.number}` : 'Endereço cadastrado'}<br>
            ${order.shippingAddress?.city ? `${order.shippingAddress.city}/${order.shippingAddress.state} - CEP ${order.shippingAddress.zipCode}` : ''}
          </div>
        </div>

        <div style="background: #fafafa; border-top: 1px solid #eee; padding: 16px; text-align: center; font-size: 12px; color: #888;">
          © ${new Date().getFullYear()} MD Essential. Todos os direitos reservados.<br>
          Dúvidas? Fale conosco pelo WhatsApp da loja.
        </div>
      </div>
    `;

    console.log(`[EMAIL] Enviando confirmação de pedido #${shortId} para ${toEmail}`);
    // Se tiver SMTP configurado, envia de fato; caso contrário, loga simulação
    if (process.env.SMTP_HOST) {
      const client = await getTransporter();
      await client.sendMail({
        from: `"${process.env.STORE_NAME || 'MD ESSENTIAL'}" <${process.env.SMTP_FROM || 'pedidos@mdessential.com.br'}>`,
        to: toEmail,
        subject: `Pedido #${shortId} Confirmado! - MD ESSENTIAL`,
        html,
      });
    }

    return { success: true, to: toEmail };
  } catch (err) {
    console.error('[EMAIL ERROR] Falha ao enviar confirmação:', err.message);
    return null;
  }
};

/**
 * Envia e-mail de Pedido Despachado com Código de Rastreio
 */
exports.sendOrderShippedEmail = async ({ order, user }) => {
  try {
    const toEmail = order.customerEmail || user?.email;
    if (!toEmail) return null;

    const shortId = order._id.toString().slice(-6).toUpperCase();
    const trackingCode = order.trackingCode || 'AGUARDANDO-CÓDIGO';
    const trackingUrl = `${process.env.APP_URL || 'http://localhost:5001'}/tracking.html?code=${trackingCode}`;

    const html = `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background: #111111; color: #ffffff; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; letter-spacing: 2px;">MD ESSENTIAL</h1>
        </div>
        
        <div style="padding: 30px;">
          <h2 style="font-size: 20px; color: #111111; margin-top: 0;">Seu pedido está a caminho! 🚚💨</h2>
          <p style="color: #444; font-size: 15px; line-height: 1.5;">
            Olá, <strong>${order.shippingAddress?.recipientName || user?.username || 'Cliente'}</strong>!<br>
            Seu pedido <strong>#${shortId}</strong> acabou de ser despachado com a transportadora <strong>${order.carrier || 'Correios'}</strong>.
          </p>

          <div style="background: #f1f3f5; border: 2px dashed #111; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0;">
            <p style="margin: 0 0 6px; font-size: 12px; color: #666; font-weight: bold; letter-spacing: 1px; text-transform: uppercase;">Código de Rastreamento</p>
            <h3 style="margin: 0; font-size: 24px; font-family: monospace; letter-spacing: 2px; color: #111;">${trackingCode}</h3>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${trackingUrl}" style="background: #28a745; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: bold; font-size: 14px; border-radius: 6px; display: inline-block;">
              RASTREAR ENTREGA EM TEMPO REAL 📍
            </a>
          </div>

          <p style="color: #777; font-size: 13px; line-height: 1.5;">
            Normalmente as transportadoras levam até 12h úteis para atualizar o primeiro status nos sistemas de rastreio.
          </p>
        </div>
      </div>
    `;

    console.log(`[EMAIL] Enviando rastreamento de pedido #${shortId} (${trackingCode}) para ${toEmail}`);
    if (process.env.SMTP_HOST) {
      const client = await getTransporter();
      await client.sendMail({
        from: `"${process.env.STORE_NAME || 'MD ESSENTIAL'}" <${process.env.SMTP_FROM || 'pedidos@mdessential.com.br'}>`,
        to: toEmail,
        subject: `Seu pedido #${shortId} foi enviado! 🚚 - MD ESSENTIAL`,
        html,
      });
    }

    return { success: true, to: toEmail, trackingCode };
  } catch (err) {
    console.error('[EMAIL ERROR] Falha ao enviar rastreamento:', err.message);
    return null;
  }
};
