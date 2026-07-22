/**
 * MD Essential — Freight Calculator
 * Calcula frete baseado na distância de Sombrio/SC (zona de origem)
 * Sem API externa — usa tabela de zonas por estado brasileiro
 */

// Zonas de frete a partir de Sombrio/SC
// Zona 1 = SC (mesmo estado, mais barato)
// Zona 6 = Norte (mais distante, mais caro)
const FREIGHT_ZONES = {
  SC: 1,
  RS: 2, PR: 2,
  SP: 3, RJ: 3, MG: 3, ES: 3,
  GO: 4, MT: 4, MS: 4, DF: 4,
  BA: 5, SE: 5, AL: 5, PE: 5, PB: 5, RN: 5, CE: 5, PI: 5, MA: 5,
  PA: 6, AM: 6, RO: 6, RR: 6, AC: 6, TO: 6, AP: 6,
};

// Tabela de preços PAC e SEDEX por zona
// Baseado em valores reais dos Correios para pacotes leves (~0.5kg)
const ZONE_TABLE = {
  1: { pac: { price: 15.90, min: 5,  max: 8  }, sedex: { price: 22.90, min: 1, max: 2  } },
  2: { pac: { price: 20.90, min: 7,  max: 10 }, sedex: { price: 29.90, min: 2, max: 3  } },
  3: { pac: { price: 26.90, min: 9,  max: 13 }, sedex: { price: 37.90, min: 3, max: 5  } },
  4: { pac: { price: 31.90, min: 11, max: 15 }, sedex: { price: 44.90, min: 4, max: 6  } },
  5: { pac: { price: 37.90, min: 13, max: 18 }, sedex: { price: 54.90, min: 5, max: 8  } },
  6: { pac: { price: 44.90, min: 16, max: 22 }, sedex: { price: 65.90, min: 7, max: 10 } },
};

const FREE_SHIPPING_THRESHOLD = 198;

/**
 * Calcula as opções de frete para um determinado estado, cidade e subtotal
 * @param {string} state - Sigla do estado (ex: "SC", "SP")
 * @param {number} subtotal - Valor do carrinho em R$
 * @param {string} city - Nome da cidade (ex: "Sombrio")
 * @returns {Array} Lista de opções de frete
 */
export function calculateFreight(state, subtotal = 0, city = '') {
  const isSombrio = city.toLowerCase().includes('sombrio') || state?.toUpperCase() === 'SC';
  const zone = FREIGHT_ZONES[state?.toUpperCase()] || 4; // zona 4 (centro) como padrão desconhecido
  const table = ZONE_TABLE[zone];

  const options = [];

  // Se for Sombrio/SC (mesmo município de origem)
  if (city.toLowerCase().includes('sombrio')) {
    options.push({
      id: 'local_sombrio',
      name: 'Entrega Local Sombrio (Denitex / Centro)',
      description: 'Entrega expressa no mesmo dia em Sombrio',
      price: 0,
      days: 'Mesmo dia / 24h úteis',
      icon: 'fa-motorcycle',
    });
  }

  options.push(
    {
      id: 'pac',
      name: 'PAC — Correios',
      description: 'Entrega Econômica',
      price: table.pac.price,
      days: `${table.pac.min} a ${table.pac.max} dias úteis`,
      icon: 'fa-box',
    },
    {
      id: 'sedex',
      name: 'SEDEX — Correios',
      description: 'Entrega Expressa',
      price: table.sedex.price,
      days: `${table.sedex.min} a ${table.sedex.max} dias úteis`,
      icon: 'fa-bolt',
    }
  );

  // Frete grátis acima do threshold
  if (subtotal >= FREE_SHIPPING_THRESHOLD && !options.some(o => o.id === 'local_sombrio')) {
    options.unshift({
      id: 'free',
      name: 'Frete Grátis',
      description: 'Parabéns! Você ganhou frete grátis.',
      price: 0,
      days: `${table.pac.min + 2} a ${table.pac.max + 4} dias úteis`,
      icon: 'fa-gift',
    });
  }

  return options;
}

/**
 * Retorna a zona e informações de distância para um estado
 * @param {string} state
 */
export function getFreightZoneInfo(state) {
  const zone = FREIGHT_ZONES[state?.toUpperCase()];
  if (!zone) return null;
  const labels = {
    1: 'Santa Catarina (mesmo estado)',
    2: 'Sul do Brasil',
    3: 'Sudeste',
    4: 'Centro-Oeste',
    5: 'Nordeste',
    6: 'Norte do Brasil',
  };
  return { zone, label: labels[zone] };
}

export { FREE_SHIPPING_THRESHOLD };
