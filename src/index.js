require("dotenv").config();
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const cron = require("node-cron");
const pino = require("pino");
const path = require("path");
const fs = require("fs");
const qrcode = require("qrcode-terminal");

const { searchBestDeal, buildMessage } = require("./mercadolivre");
const { checkPriceDrops } = require("./monitor");
const products = require("../products/list");

// =============================================
// CONFIGURAÇÕES
// =============================================
const AFFILIATE_ID = process.env.ML_AFFILIATE_ID || "samuel_antonio"; 
const AUTH_FOLDER = path.join(__dirname, "../config/auth_banana"); // Alterado para forçar nova sessão limpa
const GROUP_FILE = path.join(__dirname, "../config/group.json");

// Garante que pastas existam
if (!fs.existsSync(AUTH_FOLDER)) fs.mkdirSync(AUTH_FOLDER, { recursive: true });
if (!fs.existsSync(path.join(__dirname, "../config"))) {
  fs.mkdirSync(path.join(__dirname, "../config"), { recursive: true });
}

// =============================================
// CONTROLE DO GRUPO
// =============================================
function getGroupId() {
  try {
    if (fs.existsSync(GROUP_FILE)) {
      return JSON.parse(fs.readFileSync(GROUP_FILE)).groupId;
    }
  } catch {}
  return process.env.WHATSAPP_GROUP_ID || null;
}

function saveGroupId(id) {
  fs.writeFileSync(GROUP_FILE, JSON.stringify({ groupId: id }));
  console.log(`[CONFIG] Grupo salvo: ${id}`);
}

// =============================================
// ENVIO DE MENSAGEM
// =============================================
let sock = null;

async function sendToGroup(message) {
  const groupId = getGroupId();
  if (!groupId) {
    console.error("[BOT] Grupo não configurado! Envie !configurar no grupo primeiro.");
    return;
  }
  if (!sock) {
    console.error("[BOT] WhatsApp não conectado.");
    return;
  }
  try {
    await sock.sendMessage(groupId, { text: message });
    console.log(`[BOT] Mensagem enviada com sucesso ✓`);
  } catch (err) {
    console.error("[BOT] Erro ao enviar mensagem:", err.message);
  }
}

// =============================================
// BUSCA E POSTA OFERTA
// =============================================
async function postOffer(productConfig) {
  console.log(`[BOT] Buscando oferta: ${productConfig.label}...`);
  const product = await searchBestDeal(productConfig.query, productConfig.maxPrice);

  if (!product) {
    console.warn(`[BOT] Nenhum produto encontrado para: ${productConfig.query}`);
    return;
  }

  const message = buildMessage(product, AFFILIATE_ID, productConfig.label, productConfig.emoji);
  await sendToGroup(message);

  // Delay humanizado entre postagens (30s a 90s)
  const delay = Math.floor(Math.random() * 60000) + 30000;
  console.log(`[BOT] Próxima postagem em ${Math.round(delay / 1000)}s...`);
  return delay;
}

// Posta os 5 produtos de um slot com delay entre cada um
async function postSlot(slot) {
  const slotProducts = products.filter((p) => p.slot === slot);
  console.log(`\n[CRON] Iniciando slot "${slot}" com ${slotProducts.length} produtos...`);

  for (let i = 0; i < slotProducts.length; i++) {
    await postOffer(slotProducts[i]);
    if (i < slotProducts.length - 1) {
      // Delay de 3 a 7 minutos entre cada postagem do slot
      const delay = Math.floor(Math.random() * 240000) + 180000;
      console.log(`[BOT] Aguardando ${Math.round(delay / 60000)} min para próxima oferta...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  console.log(`[CRON] Slot "${slot}" concluído ✓\n`);
}

// =============================================
// AGENDAMENTO (node-cron)
// Fuso: America/Sao_Paulo
// =============================================
function startScheduler() {
  // 🌅 MANHÃ - começa às 07:00
  cron.schedule("0 7 * * *", () => postSlot("manha"), {
    timezone: "America/Sao_Paulo",
  });

  // ☀️ TARDE - começa às 12:00
  cron.schedule("0 12 * * *", () => postSlot("tarde"), {
    timezone: "America/Sao_Paulo",
  });

  // 🌙 NOITE - começa às 18:30
  cron.schedule("30 18 * * *", () => postSlot("noite"), {
    timezone: "America/Sao_Paulo",
  });

  // 📉 MONITOR DE PREÇO - verifica a cada 2 horas
  cron.schedule("0 */2 * * *", async () => {
    console.log("[MONITOR] Verificando quedas de preço...");
    const alerts = await checkPriceDrops(products, AFFILIATE_ID);
    for (const alert of alerts) {
      await sendToGroup(alert);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }, { timezone: "America/Sao_Paulo" });

  console.log("[CRON] Agendamentos configurados:");
  console.log("  🌅 Manhã:   07:00");
  console.log("  ☀️  Tarde:   12:00");
  console.log("  🌙 Noite:   18:30");
  console.log("  📉 Monitor: a cada 2h\n");
}

// =============================================
// CONEXÃO WHATSAPP
// =============================================
async function connectWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);

  sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" }), 
    browser: ["BananaBot", "Chrome", "1.0.0"], 
  });

  // Salva credenciais sempre que atualizar
  sock.ev.on("creds.update", saveCreds);

  // Gerencia conexão
  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log("\n📱 QR CODE gerado! Escaneie com seu WhatsApp.\n");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "close") {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
      
      // Verifica se o motivo é desconexão definitiva (Logged Out ou Erro 405)
      const isLoggedOut = reason === DisconnectReason.loggedOut || reason === 405;

      console.log(`[WA] Conexão encerrada. Motivo: ${reason}`);

      if (!isLoggedOut) {
        console.log("[WA] Erro temporário. Reconectando em 5s...");
        setTimeout(connectWhatsApp, 5000);
      } else {
        console.log("\n❌ [WA] SESSÃO INVÁLIDA OU PARADA.");
        console.log("Feche o terminal, apague as pastas dentro de config/ e reinicie para gerar um QR Code limpo.\n");
        process.exit(1); // Para o processo para evitar loops infinitos no terminal
      }
    }

    if (connection === "open") {
      console.log("\n✅ WhatsApp conectado com sucesso!\n");
      startScheduler();
    }
  });

  // Escuta mensagens para configuração do grupo
  sock.ev.on("messages.upsert", async ({ messages }) => {
    for (const msg of messages) {
      if (!msg.message) continue;

      const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        "";

      const fromGroup = msg.key.remoteJid?.endsWith("@g.us");

      // Comando: !configurar (enviado dentro do grupo)
      if (text.trim() === "!configurar" && fromGroup) {
        const groupId = msg.key.remoteJid;
        saveGroupId(groupId);
        await sock.sendMessage(groupId, {
          text: "✅ *Grupo configurado com sucesso!*\n🍌 O bot está pronto para postar ofertas aqui.",
        });
      }

      // Comando: !testar (testa postagem manual)
      if (text.trim() === "!testar" && fromGroup) {
        await sock.sendMessage(msg.key.remoteJid, {
          text: "🔄 Testando oferta... aguarde!",
        });
        await postOffer(products[0]);
      }

      // Comando: !status
      if (text.trim() === "!status" && fromGroup) {
        const groupId = getGroupId();
        const status =
          `🤖 *Status do BananaBot*\n` +
          `━━━━━━━━━━━━━━━━━━━\n` +
          `📦 Produtos: ${products.length}\n` +
          `🔗 Afiliado: ${AFFILIATE_ID === "SEU_ID_AQUI" ? "❌ Não configurado" : "✅ OK"}\n` +
          `📍 Grupo: ${groupId ? "✅ Configurado" : "❌ Não configurado"}\n` +
          `🌅 Manhã: 07:00\n` +
          `☀️ Tarde: 12:00\n` +
          `🌙 Noite: 18:30\n` +
          `━━━━━━━━━━━━━━━━━━━\n` +
          `🍌 Tá no Preço de Banana`;
        await sock.sendMessage(msg.key.remoteJid, { text: status });
      }
    }
  });
}

// =============================================
// INICIALIZAÇÃO
// =============================================
console.log("🍌 BananaBot iniciando...\n");
connectWhatsApp().catch(console.error);