const qrcode = require('qrcode-terminal')
const { Client, LocalAuth } = require('whatsapp-web.js')

const client = new Client({
  puppeteer: {
    executablePath: '/usr/bin/chromium-browser',
    headless: true,
    timeout: 60000,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--no-zygote',
      '--single-process'
    ]
  }
})

const estados = {}

const palavrasReset = [
  'oi',
  'oii',
  'ola',
  'olá',
  'menu',
  'inicio',
  'início',
  'bom',
  'bom dia',
  'boa',
  'boa tarde',
  'boa noite',
  'comprei',
  'faz',
  'bom dia, tudo bem?',
  'boa tarde, tudo bem?',
  'boa noite, tudo bem?'
]

const delay = ms => new Promise(res => setTimeout(res, ms))

// ============================
// VALIDAÇÕES
// ============================

function validarCPF(cpf) {
  cpf = cpf.replace(/\D/g, '')

  if (cpf.length !== 11) return false
  if (/^(\d)\1+$/.test(cpf)) return false

  let soma = 0
  let resto

  for (let i = 1; i <= 9; i++)
    soma += parseInt(cpf.substring(i - 1, i)) * (11 - i)

  resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  if (resto !== parseInt(cpf.substring(9, 10))) return false

  soma = 0

  for (let i = 1; i <= 10; i++)
    soma += parseInt(cpf.substring(i - 1, i)) * (12 - i)

  resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0

  if (resto !== parseInt(cpf.substring(10, 11))) return false

  return true
}

function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

// ============================
// EVENTOS
// ============================

client.on('qr', qr => {
  console.log('Escaneie o QR Code')
  qrcode.generate(qr, { small: true })
})

client.on('ready', () => {
  console.log('🚀 WhatsApp conectado!')
})

client.initialize()

// ============================
// BOT
// ============================

client.on('message_create', async msg => {
  // 🚫 IGNORA mensagens do próprio bot (FORMA SEGURA)
  if (msg.from === client.info.wid._serialized) {
    return
  }

  // 🚫 IGNORA mensagens enviadas pelo bot (backup)
  if (msg.fromMe) return

  // 👉 SE VOCÊ RESPONDEU → PAUSA BOT
  if (msg.fromMe && !msg.from.includes('@lid')) {
    if (estados[msg.to]) {
      estados[msg.to].pausado = true
      //console.log("🛑 Bot pausado para:", msg.to)
    }

    return
  }

  if (!msg.body) return

  const texto = msg.body.trim().toLowerCase()

  //console.log("Mensagem:", texto)

  const chat = await msg.getChat()

  // ============================
  // RESET INTELIGENTE
  // ============================

  if (estados[msg.from]?.pausado) {
    if (!palavrasReset.includes(texto)) {
      return
    }

    //console.log("🔄 Bot reativado para:", msg.from)

    delete estados[msg.from]
  }

  // ============================
  // MENU INICIAL
  // ============================

  if (!estados[msg.from]) {
    const contact = await msg.getContact()
    const nome = contact.pushname || 'Cliente'

    estados[msg.from] = {
      etapa: 'menu'
    }

    await delay(1000)
    await chat.sendStateTyping()
    await delay(1000)

    await client.sendMessage(
      msg.from,
      `Olá, ${nome.split(' ')[0]}! 👋

Sou o Sunny ☀️, assistente virtual da *Trilha do Sol Shop*.

Como podemos te ajudar?
Digite o número abaixo para saber mais:

1 - 🏕️ Produtos para Camping
2 - 🌊 Produtos para Praia
3 - 🔥 Ofertas
4 - 🚚 Prazo e Frete
5 - 💳 Formas de Pagamento
6 - 📦 Acompanhar Pedido
7 - ❓ Falar com Atendente`
    )

    return
  }

  // ============================
  // MENU VALIDAÇÃO
  // ============================

  if (estados[msg.from].etapa === 'menu') {
    if (!['1', '2', '3', '4', '5', '6', '7'].includes(texto)) {
      await client.sendMessage(
        msg.from,
        'Desculpe, preciso que me diga qual número da opção deseja prosseguir.'
      )

      return
    }
  }

  // ============================
  // OPÇÕES
  // ============================

  if (texto === '1') {
    await client.sendMessage(
      msg.from,
      `🏕️ Produtos para Camping:

Nosso site oferece vários artigos para camping.

Link: https://www.trilhadosolshop.com.br/camping/`
    )
    return
  }

  if (texto === '2') {
    await client.sendMessage(
      msg.from,
      `🌊 Produtos para Praia:

Nosso site oferece vários artigos para praia.

Link: https://www.trilhadosolshop.com.br/praia/`
    )
    return
  }

  if (texto === '3') {
    await client.sendMessage(
      msg.from,
      `🔥 Ofertas Imperdíveis:

Link: https://www.trilhadosolshop.com.br/ofertas/`
    )
    return
  }

  if (texto === '4') {
    await client.sendMessage(
      msg.from,
      `🚚 Prazos e Frete:

O prazo de entrega passa a contar após a confirmação do pagamento e a postagem do pedido.

📦 Produtos enviados a partir do Brasil: 5 a 15 dias úteis.

🌍 Produtos do exterior: 15 a 45 dias úteis.

https://www.trilhadosolshop.com.br/politica-de-entrega/`
    )
    return
  }

  if (texto === '5') {
    await client.sendMessage(
      msg.from,
      `💳 Formas de Pagamento:

Cartão, Boleto e Pix.

https://www.trilhadosolshop.com.br/termos-de-servico/`
    )
    return
  }

  if (texto === '6') {
    await client.sendMessage(
      msg.from,
      `📦 Acompanhar Pedido:

https://www.trilhadosolshop.com.br/account/`
    )
    return
  }

  // ============================
  // ATENDENTE
  // ============================

  if (texto === '7') {
    estados[msg.from].etapa = 'cpf'

    await client.sendMessage(
      msg.from,
      `Perfeito! ☀️

Para falar com o atendente, preciso de algumas informações.

📄 Digite seu CPF:`
    )

    return
  }

  // ============================
  // CPF
  // ============================

  if (estados[msg.from].etapa === 'cpf') {
    if (!validarCPF(texto)) {
      await client.sendMessage(msg.from, 'CPF inválido, digite novamente.')
      return
    }

    estados[msg.from].cpf = texto
    estados[msg.from].etapa = 'email'

    await client.sendMessage(msg.from, '📧 Agora digite seu Email:')
    return
  }

  // ============================
  // EMAIL
  // ============================

  if (estados[msg.from].etapa === 'email') {
    if (!validarEmail(texto)) {
      await client.sendMessage(msg.from, 'Email inválido, digite novamente.')
      return
    }

    estados[msg.from].email = texto
    estados[msg.from].etapa = 'pedido'

    await client.sendMessage(msg.from, '📦 Digite o Número do Pedido:')
    return
  }

  // ============================
  // PEDIDO
  // ============================

  if (estados[msg.from].etapa === 'pedido') {
    estados[msg.from].pedido = texto

    const contato = await msg.getContact()
    const nomeCliente = contato.pushname || contato.number

    const resumo = `📞 *NOVO ATENDIMENTO*

👤 Cliente: ${nomeCliente}
📄 CPF: ${estados[msg.from].cpf}
📧 Email: ${estados[msg.from].email}
📦 Pedido: ${texto}

👉 https://wa.me/${contato.number}`

    try {
      const grupoId = '120363423361149730@g.us'

      await client.sendMessage(grupoId, resumo)
    } catch (erro) {
      console.log('Erro ao enviar para grupo:', erro)
    }

    await client.sendMessage(
      msg.from,
      `Obrigado! ☀️

Já enviei suas informações para nosso atendente.
Em instantes ele continuará o atendimento por aqui.`
    )

    estados[msg.from] = {
      pausado: true
    }
  }
})
