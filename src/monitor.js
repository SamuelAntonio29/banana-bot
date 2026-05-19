const fs = require("fs");
const path = require("path");
const { searchBestDeal, buildMessage } = require("./mercadolivre");

const PRICE_FILE = path.join(__dirname, "../config/prices.json");

// Carrega histórico de preços salvo
function loadPrices() {
  try {
    if (fs.existsSync(PRICE_FILE)) {
      return JSON.parse(fs.readFileSync(PRICE_FILE, "utf8"));
    }
  } catch {}
  return {};
}

// Salva histórico de preços
function savePrices(data) {
  fs.writeFileSync(PRICE_FILE, JSON.stringify(data, null, 2));
}

// Monitora uma lista de produtos e retorna alertas de queda de preço
async function checkPriceDrops(watchList, affiliateId) {
  const history = loadPrices();
  const alerts = [];

  for (const item of watchList) {
    try {
      const product = await searchBestDeal(item.query);
      if (!product) continue;

      const key = item.query;
      const currentPrice = product.price;
      const previousPrice = history[key]?.price;

      // Salva preço atual
      history[key] = {
        price: currentPrice,
        title: product.title,
        updatedAt: new Date().toISOString(),
      };

      // Verifica se houve queda de preço (mínimo 5% de diferença)
      if (previousPrice && currentPrice < previousPrice) {
        const dropPercent = (((previousPrice - currentPrice) / previousPrice) * 100).toFixed(1);

        if (dropPercent >= 5) {
          const msg = buildMessage(product, affiliateId, item.label, "🔥");
          const alertMsg =
            `🚨 *ALERTA DE QUEDA DE PREÇO!*\n` +
            `📉 Caiu ${dropPercent}% (era ${previousPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })})\n\n` +
            msg;

          alerts.push(alertMsg);
          console.log(`[MONITOR] Queda detectada em "${item.label}": -${dropPercent}%`);
        }
      }
    } catch (err) {
      console.error(`[MONITOR] Erro ao monitorar "${item.query}":`, err.message);
    }

    // Delay entre buscas para não sobrecarregar a API
    await new Promise((r) => setTimeout(r, 1500));
  }

  savePrices(history);
  return alerts;
}

module.exports = { checkPriceDrops };
