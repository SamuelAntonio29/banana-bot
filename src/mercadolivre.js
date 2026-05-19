const axios = require("axios");

const ML_API = "https://api.mercadolibre.com";

// =============================================
// AUTENTICAÇÃO OAUTH - Client Credentials
// =============================================
let accessToken = null;
let tokenExpiry = 0;

async function getAccessToken() {
  if (accessToken && Date.now() < tokenExpiry - 300000) {
    return accessToken;
  }
  try {
    const response = await axios.post("https://api.mercadolibre.com/oauth/token", {
      grant_type: "client_credentials",
      client_id: process.env.ML_CLIENT_ID,
      client_secret: process.env.ML_CLIENT_SECRET,
    });
    accessToken = response.data.access_token;
    tokenExpiry = Date.now() + response.data.expires_in * 1000;
    console.log("[ML] Token de acesso renovado ✓");
    return accessToken;
  } catch (err) {
    console.error("[ML] Erro ao obter token:", err.response?.data || err.message);
    return null;
  }
}

// Busca o melhor produto para um termo de pesquisa
async function searchBestDeal(query, maxPrice = null) {
  try {
    const token = await getAccessToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const params = {
      q: query,
      sort: "price_asc",
      limit: 10,
      condition: "new",
    };

    const response = await axios.get(`${ML_API}/sites/MLB/search`, { params, headers });
    const results = response.data.results;

    if (!results || results.length === 0) return null;

    let filtered = maxPrice
      ? results.filter((p) => p.price <= maxPrice)
      : results;

    if (filtered.length === 0) filtered = results;

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
function buildAffiliateLink(productPermalink, affiliateTag) {
  const base = productPermalink || "";
  if (!affiliateTag || affiliateTag === "SEU_ID_AQUI") return base;
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}picid=${affiliateTag}`;
}

// Formata o preço em Real
function formatPrice(price) {
  return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Frases de gancho por categoria
function getHook(label) {
  const l = label.toLowerCase();
  if (l.includes("fone") || l.includes("caixinha") || l.includes("som"))
    return { fire: "🎧 PRA OUVIR NO ÚLTIMO VOLUME 🔊", vibe: "Som incrível por esse preço é cilada 😮‍💨" };
  if (l.includes("airfryer") || l.includes("fritadeira"))
    return { fire: "🍟 PRA FRITAR SEM CULPA 😍", vibe: "Air fryer boa, preço melhor ainda 🔥" };
  if (l.includes("smartwatch") || l.includes("relógio"))
    return { fire: "⌚ PRA SE SENTIR CEO 😎", vibe: "Smartwatch estiloso no pulso por esse preço?" };
  if (l.includes("carregador"))
    return { fire: "⚡ ACABOU A DESCULPA DE BATERIA FRACA 😂", vibe: "Carrega rápido, preço mais rápido ainda 🔋" };
  if (l.includes("samsung") || l.includes("celular") || l.includes("smartphone"))
    return { fire: "📱 CELULAR BOM NÃO PRECISA CUSTAR CARO 🤯", vibe: "Essa oferta não vai durar muito não..." };
  if (l.includes("notebook") || l.includes("laptop"))
    return { fire: "💻 PRA TRABALHAR OU ESTUDAR COM ESTILO 🚀", vibe: "Notebook top por esse valor é raro demais" };
  if (l.includes("tablet"))
    return { fire: "📲 TELA GRANDE, PREÇO PEQUENO 😯", vibe: "Tablet pra toda família por esse preço 🔥" };
  if (l.includes("câmera") || l.includes("segurança"))
    return { fire: "📷 OLHO NO OLHO, 24H POR DIA 👀", vibe: "Segurança em casa por menos do que você imagina" };
  if (l.includes("mouse") || l.includes("gamer"))
    return { fire: "🖱️ PRA DOMINAR NO JOGO 🎮", vibe: "Setup gamer sem gastar o salário todo" };
  if (l.includes("ventilador"))
    return { fire: "💨 PRA SOBREVIVER AO CALOR BRASILEIRO ☀️", vibe: "Esse calor tá bravo, mas o preço tá manso 😅" };
  if (l.includes("cadeira"))
    return { fire: "🪑 PRA SENTAR COMO REI 👑", vibe: "Trabalha ou joga em casa? Precisa dessa!" };
  if (l.includes("panela") || l.includes("pressão"))
    return { fire: "🍲 PRA COZINHAR RÁPIDO E BEM 😋", vibe: "O feijão vai ficar ainda mais gostoso 🫘" };
  if (l.includes("perfume") || l.includes("colônia"))
    return { fire: "🌸 PRA ANDAR CHEIROSO O DIA TODO 😮‍💨", vibe: "Fragrância incrível por esse preço é roubo!" };
  if (l.includes("colchão"))
    return { fire: "🛏️ PRA DORMIR COMO NUNCA 😴", vibe: "Boa noite de sono começa aqui" };
  return { fire: "🔥 OFERTA QUE NÃO DÁ PRA DEIXAR PASSAR 😱", vibe: "Corre que é por tempo limitado!" };
}

// Monta a mensagem formatada para o WhatsApp
function buildMessage(product, affiliateId, label, emoji) {
  const link = buildAffiliateLink(product.permalink, affiliateId);
  const price = formatPrice(product.price);
  const freeShipping = product.shipping?.free_shipping;
  const installments = product.installments;
  const discount = product.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : null;

  const hook = getHook(label);

  let msg = "";
  msg += `🔥 *${hook.fire}*\n\n`;
  msg += `💥 ${product.title}\n`;
  msg += `💰 *por ${price}*\n\n`;
  if (freeShipping) msg += `✅ Frete Grátis\n`;
  if (installments && installments.quantity > 1) {
    const installValue = formatPrice(installments.amount);
    msg += `✅ ${installments.quantity}x de ${installValue} sem juros\n`;
  }
  if (discount && discount >= 5) msg += `✅ ${discount}% OFF\n`;
  msg += `\n_${hook.vibe}_\n`;
  msg += `\n🚨 *Corre que acaba!* 🍌\n`;
  msg += `🔗 Acesse o link:\n${link}`;

  return msg;
}

module.exports = { searchBestDeal, buildAffiliateLink, buildMessage };
