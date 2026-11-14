const assert = require('assert');
const crypto = require('crypto');
const mercadoPagoService = require('./src/services/mercadoPagoService');

async function runTests() {
  console.log('--- TESTE 1: Validação de Assinatura Webhook (HMAC SHA-256) ---');
  const secret = 'test_webhook_secret_key_123';
  process.env.MP_WEBHOOK_SECRET = secret;

  const dataId = '9876543210';
  const requestId = 'req-uuid-12345';
  const ts = Math.floor(Date.now() / 1000).toString();

  // Gera assinatura válida conforme manifest do Mercado Pago
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const validHmac = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
  const signatureHeader = `ts=${ts},v1=${validHmac}`;

  const isValid = mercadoPagoService.verifyWebhookSignature({
    signatureHeader,
    requestIdHeader: requestId,
    dataId
  });

  assert.strictEqual(isValid, true, 'Assinatura válida deve retornar true');
  console.log('✅ Assinatura válida verificada com sucesso!');

  // Testa assinatura adulterada/inválida
  const isInvalid = mercadoPagoService.verifyWebhookSignature({
    signatureHeader: `ts=${ts},v1=invalid_fake_signature_hash`,
    requestIdHeader: requestId,
    dataId
  });
  assert.strictEqual(isInvalid, false, 'Assinatura inválida deve retornar false');
  console.log('✅ Assinatura inválida rejeitada com sucesso!');

  console.log('\n--- TESTE 2: Criação de Preferência Checkout Pro ---');
  const mockOrder = {
    _id: '6735a1b2c3d4e5f6a7b8c9d0',
    shippingPrice: 15.90,
    shippingMethod: 'Correios SEDEX',
    customerPhone: '11987654321',
    customerEmail: 'comprador@teste.com',
    shippingAddress: {
      recipientName: 'João da Silva',
      phone: '11987654321',
      zipCode: '01001-000',
      street: 'Praça da Sé',
      number: '100'
    },
    items: [
      {
        productId: '6735a1b2c3d4e5f6a7b8c9d1',
        name: 'Camiseta Oversized MD Street',
        price: 129.90,
        quantity: 2,
        size: 'G',
        color: 'Preto'
      }
    ]
  };

  const prefResult = await mercadoPagoService.createPreference({
    order: mockOrder,
    items: mockOrder.items,
    payer: {
      name: 'João da Silva',
      email: 'comprador@teste.com',
      phone: '11987654321'
    }
  });

  assert(prefResult.id, 'Preferência deve conter ID');
  assert(prefResult.init_point, 'Preferência deve conter init_point para redirecionamento');
  console.log('✅ Preferência gerada com sucesso:', prefResult);

  console.log('\n--- TESTE 3: Consulta de Pagamento ---');
  const payment = await mercadoPagoService.getPayment('9876543210');
  assert(payment, 'Consulta de pagamento deve retornar objeto');
  assert.strictEqual(payment.id, '9876543210', 'ID do pagamento deve coincidir');
  console.log('✅ Consulta de pagamento concluída com sucesso:', payment);

  console.log('\n======================================');
  console.log('🎉 TODOS OS TESTES PASSARAM COM SUCESSO!');
  console.log('======================================');
}

runTests().catch(err => {
  console.error('❌ Erro durante os testes:', err);
  process.exit(1);
});
