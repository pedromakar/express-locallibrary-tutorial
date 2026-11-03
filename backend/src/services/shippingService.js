/**
 * Shipping Service - Cálculo de Frete & Logística
 * Suporta Melhor Envio API ou Motor de Cálculo Nacional (Sombrio/SC -> Brasil)
 */

const ORIGIN_CEP = '88960000'; // Sombrio / SC

/**
 * Normaliza CEP removendo traços e espaços
 */
function cleanCep(cep) {
  return (cep || '').toString().replace(/\D/g, '');
}

/**
 * Identifica a região do Brasil com base no primeiro dígito do CEP
 */
function getRegionFromCep(cep) {
  const clean = cleanCep(cep);
  if (!clean || clean.length !== 8) return 'BR';

  const firstDigit = parseInt(clean[0], 10);
  switch (firstDigit) {
    case 0:
    case 1:
      return 'SP';
    case 2:
      return 'RJ_ES';
    case 3:
      return 'MG';
    case 4:
    case 5:
      return 'BA_SE_PE_AL_PB_RN_CE_PI_MA'; // Nordeste
    case 6:
      return 'NO_AM_RR_AP_PA_MA'; // Norte
    case 7:
      return 'CO_DF_GO_TO_MT_MS'; // Centro-Oeste
    case 8:
      return 'PR_SC'; // Região da Fábrica
    case 9:
      return 'RS'; // Vizinho
    default:
      return 'BR';
  }
}

/**
 * Calcula opções de frete (PAC, SEDEX, Jadlog)
 */
exports.calculateShipping = async ({ destinationCep, items = [], cartTotal = 0 }) => {
  const clean = cleanCep(destinationCep);
  if (clean.length !== 8) {
    throw new Error('CEP de destino inválido. Deve conter 8 dígitos.');
  }

  // Se houver token do Melhor Envio configurado
  if (process.env.MELHOR_ENVIO_TOKEN) {
    try {
      const url = process.env.MELHOR_ENVIO_ENV === 'production' 
        ? 'https://melhorenvio.com.br/api/v2/me/shipment/calculate'
        : 'https://sandbox.melhorenvio.com.br/api/v2/me/shipment/calculate';

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.MELHOR_ENVIO_TOKEN}`
        },
        body: JSON.stringify({
          from: { postal_code: ORIGIN_CEP },
          to: { postal_code: clean },
          products: items.map((item, idx) => ({
            id: item.productId || `item_${idx}`,
            width: 15,
            height: 4,
            length: 20,
            weight: 0.3 * (item.quantity || 1),
            insurance_value: (item.price || 50) * (item.quantity || 1),
            quantity: item.quantity || 1
          }))
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Formata os dados retornados pelo Melhor Envio
        return data.filter(d => !d.error).map(s => ({
          id: s.id,
          name: s.name,
          company: s.company?.name || 'Transportadora',
          price: parseFloat(s.price),
          deliveryDays: s.delivery_time,
          freeShipping: cartTotal >= 198 && /pac/i.test(s.name)
        }));
      }
    } catch (err) {
      console.warn('[MELHOR ENVIO] Erro na API remota, usando motor local:', err.message);
    }
  }

  // Motor Inteligente Local com base na distância de Sombrio/SC
  const region = getRegionFromCep(clean);
  let basePac = 18.90;
  let baseSedex = 29.90;
  let baseJadlog = 19.50;
  let daysPac = 4;
  let daysSedex = 2;
  let daysJadlog = 3;

  if (region === 'PR_SC') {
    // Mesma região (SC/PR)
    basePac = 14.90;
    baseSedex = 22.90;
    baseJadlog = 15.50;
    daysPac = 3;
    daysSedex = 1;
    daysJadlog = 2;
  } else if (region === 'RS') {
    // Estado vizinho
    basePac = 16.90;
    baseSedex = 24.90;
    baseJadlog = 17.00;
    daysPac = 3;
    daysSedex = 2;
    daysJadlog = 3;
  } else if (region === 'SP') {
    basePac = 19.90;
    baseSedex = 31.90;
    baseJadlog = 20.50;
    daysPac = 4;
    daysSedex = 2;
    daysJadlog = 3;
  } else if (region === 'RJ_ES' || region === 'MG') {
    basePac = 23.90;
    baseSedex = 38.90;
    baseJadlog = 24.50;
    daysPac = 5;
    daysSedex = 2;
    daysJadlog = 4;
  } else if (region.includes('Nordeste') || region.includes('BA')) {
    basePac = 29.90;
    baseSedex = 49.90;
    baseJadlog = 32.00;
    daysPac = 7;
    daysSedex = 3;
    daysJadlog = 6;
  } else {
    // Norte / Centro-Oeste
    basePac = 34.90;
    baseSedex = 56.90;
    baseJadlog = 36.00;
    daysPac = 8;
    daysSedex = 4;
    daysJadlog = 7;
  }

  // Regra de Frete Grátis acima de R$ 198
  const isFree = cartTotal >= 198;

  return [
    {
      id: 'correios_pac',
      name: 'Correios PAC',
      company: 'Correios',
      price: isFree ? 0.00 : basePac,
      originalPrice: basePac,
      deliveryDays: daysPac,
      freeShipping: isFree,
      description: isFree ? 'Frete Grátis Aplicado!' : `Entrega em até ${daysPac} dias úteis`
    },
    {
      id: 'correios_sedex',
      name: 'Correios SEDEX (Expresso)',
      company: 'Correios',
      price: baseSedex,
      originalPrice: baseSedex,
      deliveryDays: daysSedex,
      freeShipping: false,
      description: `Mais Rápido: entrega em até ${daysSedex} dias úteis`
    },
    {
      id: 'jadlog_package',
      name: 'Jadlog .Package',
      company: 'Jadlog',
      price: baseJadlog,
      originalPrice: baseJadlog,
      deliveryDays: daysJadlog,
      freeShipping: false,
      description: `Transportadora Privada: em até ${daysJadlog} dias úteis`
    }
  ];
};
