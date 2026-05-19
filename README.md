# 🍌 BananaBot — Tá no Preço de Banana

Bot de ofertas automático para WhatsApp, integrado com Mercado Livre.

---

## 📋 O que ele faz

- ✅ Posta **5 ofertas de manhã** (a partir das 07:00)
- ✅ Posta **5 ofertas de tarde** (a partir das 12:00)
- ✅ Posta **5 ofertas de noite** (a partir das 18:30)
- ✅ **Monitora preços** a cada 2 horas e alerta quando cair 5%+
- ✅ Gera links com seu **ID de afiliado** automaticamente
- ✅ Delay humanizado entre postagens (evita banimento)

---

## 🚀 Passo a passo para instalar

### 1. Instale o Node.js
Acesse https://nodejs.org e instale a versão LTS.

### 2. Baixe o projeto
Coloque a pasta `banana-bot` em qualquer lugar do seu computador ou servidor.

### 3. Instale as dependências
Abra o terminal dentro da pasta `banana-bot` e rode:
```bash
npm install
```

### 4. Configure seu ID de afiliado
- Acesse: https://www.mercadolivre.com.br/afiliados
- Crie sua conta de afiliado (gratuito)
- Copie seu **ID de afiliado**
- Abra o arquivo `.env` e substitua `SEU_ID_AQUI` pelo seu ID

### 5. Inicie o bot
```bash
npm start
```

### 6. Escaneie o QR Code
- Um QR Code vai aparecer no terminal
- Abra o WhatsApp no celular
- Vá em: **⋮ Menu → Aparelhos conectados → Conectar aparelho**
- Escaneie o QR Code

### 7. Configure o grupo
- Vá no seu grupo **Tá no Preço de Banana** no WhatsApp
- Envie a mensagem: `!configurar`
- O bot vai confirmar que está pronto!

---

## ⚙️ Comandos disponíveis no grupo

| Comando | O que faz |
|---------|-----------|
| `!configurar` | Registra o grupo para receber as ofertas |
| `!testar` | Posta uma oferta imediatamente para testar |
| `!status` | Mostra o status atual do bot |

---

## 📦 Personalizar produtos

Edite o arquivo `products/list.js`:

```js
{
  slot: "manha",          // manha, tarde ou noite
  query: "airfryer",      // termo de busca no ML
  label: "🍟 Air Fryer",  // nome que aparece na mensagem
  emoji: "🌅",            // emoji do slot
  maxPrice: 300,          // preço máximo (opcional)
}
```

---

## ☁️ Rodar na nuvem (Railway.app) — GRÁTIS

1. Crie conta em https://railway.app
2. Clique em **New Project → Deploy from GitHub**
3. Faça upload do projeto ou conecte ao GitHub
4. Configure as variáveis de ambiente:
   - `ML_AFFILIATE_ID` = seu ID de afiliado
5. O bot vai iniciar, mas você precisará escanear o QR Code uma vez
6. Após escanear, a sessão fica salva e não precisa mais

> **Dica:** Na primeira vez, rode localmente para escanear o QR Code.
> Depois suba a pasta `config/auth` junto com o projeto no Railway.

---

## ⚠️ Avisos importantes

- Este bot usa uma **biblioteca não oficial** do WhatsApp (Baileys)
- Risco de banimento existe, mas é minimizado com delays entre postagens
- Não use para spam — 15 mensagens/dia é um volume tranquilo
- Para uso profissional em escala, considere a **WhatsApp Business API**

---

## 📁 Estrutura do projeto

```
banana-bot/
├── src/
│   ├── index.js          # Arquivo principal
│   ├── mercadolivre.js   # Integração com ML API
│   └── monitor.js        # Monitor de preços
├── products/
│   └── list.js           # Lista de produtos
├── config/               # Criado automaticamente
│   ├── auth/             # Sessão do WhatsApp
│   ├── prices.json       # Histórico de preços
│   └── group.json        # ID do grupo
├── .env                  # Suas configurações
└── package.json
```
