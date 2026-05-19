const axios = require("axios");

const ML_API = "https://api.mercadolibre.com";

// Busca o melhor produto para um termo de pesquisa
async function searchBestDeal(query, maxPrice = null) {
  try {
    const params = {
      q: query,
      sort: "price_asc", // ordena do mais barato para o mais caro
      limit: 10,
      condition: "new",
      "shipping_cost": "free", // frete grátis quando possível
    };

    const response = await axios.get(`${ML_API}/sites/MLB/search`, { params });
    const results = response.data.results;

    if (!results || results.length === 0) return null;

    // Filtra por preço máximo se definido
    let filtered = maxPrice
      ? results.filter((p) => p.price <= maxPrice)
      : results;

    if (filtered.length === 0) {
      // Se não encontrou dentro do preço, pega o mais barato mesmo assim
      filtered = results;
    }

    // Prefere produtos com frete grátis e bem avaliados
    const sorted = filtered.sort((a, b) => {
      const aScore =
        (a.shipping?.free_shipping ? 50 : 0) +
        (a.seller_reputation?.transactions?.completed || 0) * 0.01;
      const bScore =
        (b.shipping?.free_shipping ? 50 : 0) +
        (b.seller_reputation?.transactions?.completed || 0) * 0.01;
      return bScore - aScore;
    });

    return sorted[0] || null;
  } catch (err) {
    console.error(`[ML] Erro ao buscar "${query}":`, err.message);
    return null;
  }
}

// Gera link com etiqueta de afiliado
// O ML usa o parâmetro "picid" com sua etiqueta para rastrear comissões
function buildAffiliateLink(productPermalink, affiliateTag) {
  // Usa o permalink real do produto quando disponível
  const base = productPermalink || "";
  if (!affiliateTag || affiliateTag === "SEU_ID_AQUI") {
    return base;
  }
  // Formato oficial: adiciona picid= com sua etiqueta ao link do produto
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}picid=${affiliateTag}`;
}

// Formata o preço em Real
function formatPrice(price) {
  return price.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// Monta a mensagem formatada para o WhatsApp
function buildMessage(product, affiliateId, label, emoji) {
  const link = buildAffiliateLink(product.permalink, affiliateId);
  const price = formatPrice(product.price);
  const freeShipping = product.shipping?.free_shipping;
  const installments = product.installments;

  let msg = "";
  msg += `${emoji} *${label}*\n`;
  msg += `━━━━━━━━━━━━━━━━━━━\n`;
  msg += `🛒 ${product.title}\n\n`;
  msg += `💰 *${price}*\n`;

  if (installments && installments.quantity > 1) {
    const installValue = formatPrice(installments.amount);
    msg += `💳 ou ${installments.quantity}x de ${installValue} sem juros\n`;
  }

  if (freeShipping) {
    msg += `✅ *Frete Grátis!*\n`;
  }

  msg += `\n🔗 ${link}\n`;
  msg += `━━━━━━━━━━━━━━━━━━━\n`;
  msg += `🍌 *Tá no Preço de Banana | Ofertas*`;

  return msg;
}

module.exports = { searchBestDeal, buildAffiliateLink, buildMessage };