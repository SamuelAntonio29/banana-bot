// =============================================
// PRODUTOS MONITORADOS - EDITE À VONTADE!
// =============================================
// Como funciona:
//   - O bot busca cada produto na API do Mercado Livre
//   - Pega o melhor preço/mais vendido da busca
//   - Gera link com seu ID de afiliado automaticamente
//   - Posta no grupo no horário programado
//
// Dica: coloque produtos com boa saída e que variam de preço
// =============================================

const products = [

  // 🌅 MANHÃ (produtos do dia a dia, praticidade)
  {
    slot: "manha",
    query: "fritadeira airfryer",
    label: "🍟 Fritadeira Air Fryer",
    emoji: "🌅",
    maxPrice: 300, // só posta se preço for até R$ 300
  },
  {
    slot: "manha",
    query: "fone de ouvido bluetooth",
    label: "🎧 Fone Bluetooth",
    emoji: "🌅",
    maxPrice: 150,
  },
  {
    slot: "manha",
    query: "smartwatch relógio inteligente",
    label: "⌚ Smartwatch",
    emoji: "🌅",
    maxPrice: 250,
  },
  {
    slot: "manha",
    query: "carregador turbo USB-C",
    label: "⚡ Carregador Turbo",
    emoji: "🌅",
    maxPrice: 80,
  },
  {
    slot: "manha",
    query: "caixinha de som bluetooth portátil",
    label: "🔊 Caixinha Bluetooth",
    emoji: "🌅",
    maxPrice: 120,
  },

  // ☀️ TARDE (eletrônicos, tecnologia)
  {
    slot: "tarde",
    query: "celular smartphone samsung",
    label: "📱 Smartphone Samsung",
    emoji: "☀️",
    maxPrice: 1500,
  },
  {
    slot: "tarde",
    query: "notebook i5",
    label: "💻 Notebook",
    emoji: "☀️",
    maxPrice: 2500,
  },
  {
    slot: "tarde",
    query: "tablet android",
    label: "📲 Tablet",
    emoji: "☀️",
    maxPrice: 800,
  },
  {
    slot: "tarde",
    query: "câmera de segurança wifi",
    label: "📷 Câmera de Segurança",
    emoji: "☀️",
    maxPrice: 200,
  },
  {
    slot: "tarde",
    query: "mouse gamer sem fio",
    label: "🖱️ Mouse Gamer",
    emoji: "☀️",
    maxPrice: 180,
  },

  // 🌙 NOITE (casa, lazer, bem-estar)
  {
    slot: "noite",
    query: "ventilador de torre",
    label: "💨 Ventilador Torre",
    emoji: "🌙",
    maxPrice: 200,
  },
  {
    slot: "noite",
    query: "cadeira gamer escritório",
    label: "🪑 Cadeira Gamer",
    emoji: "🌙",
    maxPrice: 800,
  },
  {
    slot: "noite",
    query: "panela elétrica de pressão",
    label: "🍲 Panela de Pressão Elétrica",
    emoji: "🌙",
    maxPrice: 300,
  },
  {
    slot: "noite",
    query: "colchão solteiro espuma",
    label: "🛏️ Colchão Solteiro",
    emoji: "🌙",
    maxPrice: 400,
  },
  {
    slot: "noite",
    query: "perfume importado masculino",
    label: "🌸 Perfume",
    emoji: "🌙",
    maxPrice: 250,
  },
];

module.exports = products;
