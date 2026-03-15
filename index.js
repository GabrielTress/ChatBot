// =============================
// BOT WHATSAPP - TRILHA DO SOL
// =============================

const qrcode = require('qrcode-terminal')
const { Client, LocalAuth } = require('whatsapp-web.js')

const estados = {}

// =============================
// CONFIG CLIENTE
// =============================

const client = new Client({
  authStrategy: new LocalAuth({
    clientId: 'bot-trilha-do-sol'
  }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
})

// =============================
// EVENTOS
// =============================

client.on('qr', qr => {
  console.log('📱 Escaneie o QR Code:')
  qrcode.generate(qr, { small: true })
})

client.on('authenticated', () => {
  console.log('✅ Autenticado com sucesso!')
})

client.on('ready', () => {
  console.log('🚀 WhatsApp conectado com sucesso!')
})

client.on('auth_failure', msg => {
  console.error('❌ Falha na autenticação:', msg)
})

client.on('disconnected', reason => {
  console.log('⚠️ WhatsApp desconectado:', reason)
})

client.initialize()

// =============================
// DELAY
// =============================

const delay = ms => new Promise(res => setTimeout(res, ms))

// =============================
// EVENTO PRINCIPAL
// =============================

client.on('message_create', async msg => {
  if (msg.id.fromMe) return
  if (!msg.body) return

  const texto = msg.body.trim().toLowerCase()

  console.log('Mensagem:', texto)
  console.log('Estado atual:', estados[msg.from])

  const chat = await msg.getChat()

  // =============================
  // FLUXO CPF
  // =============================

  if (estados[msg.from]?.etapa === 'cpf') {
    estados[msg.from].cpf = texto
    estados[msg.from].etapa = 'email'

    await client.sendMessage(msg.from, '📧 Agora digite seu Email:')
    return
  }

  // =============================
  // FLUXO EMAIL
  // =============================

  if (estados[msg.from]?.etapa === 'email') {
    estados[msg.from].email = texto
    estados[msg.from].etapa = 'pedido'

    await client.sendMessage(msg.from, '📦 Digite o Número do Pedido:')
    return
  }

  // =============================
  // FLUXO PEDIDO
  // =============================

  if (estados[msg.from]?.etapa === 'pedido') {
    estados[msg.from].pedido = texto

    const contato = await msg.getContact()

    const nomeCliente = contato.pushname || contato.name || contato.number

    const numeroCliente = contato.number

    const resumo =
      `📞 *NOVO ATENDIMENTO*\n\n` +
      `👤 Cliente: ${nomeCliente}\n` +
      `📄 CPF: ${estados[msg.from].cpf}\n` +
      `📧 Email: ${estados[msg.from].email}\n` +
      `📱 Número: https://wa.me/55${numeroCliente}\n` +
      `📦 Pedido: ${estados[msg.from].pedido}`

    try {
      const numeroAtendente = await client.getNumberId('5547991919840')

      if (!numeroAtendente) {
        console.log('Número do atendente não encontrado no WhatsApp')
        return
      }

      await client.sendMessage(numeroAtendente._serialized, resumo)
    } catch (error) {
      console.log('Erro ao enviar para atendente:', error)

      await client.sendMessage(
        msg.from,
        '⚠️ Não consegui encaminhar para o atendente agora.\nTente novamente em instantes.'
      )

      return
    }

    await client.sendMessage(
      msg.from,
      'Obrigado! ☀️\n\n' +
        'Já enviei suas informações para nosso atendente.\n' +
        'Em instantes ele continuará o atendimento por aqui.'
    )

    delete estados[msg.from]

    return
  }

  // =============================
  // MENU PRINCIPAL
  // =============================

  if (!estados[msg.from]) {
    await delay(1500)
    await chat.sendStateTyping()
    await delay(1500)

    const contact = await msg.getContact()
    const nome = contact.pushname || 'Cliente'

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

  // =============================
  // OPÇÕES MENU
  // =============================

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

Link: https://www.trilhadosolshop.com.br/promocoes/`
    )

    return
  }

  if (texto === '4') {
    await client.sendMessage(
      msg.from,
      `🚚 Prazos e Frete:

O prazo de entrega passa a contar após a confirmação do pagamento e a postagem do pedido.

📦 Produtos enviados a partir do Brasil: Prazo estimado: 5 a 15 dias úteis.

🌍Produtos enviados a partir do exterior: Prazo estimado: 15 a 45 dias úteis. 

Os prazos informados são estimativas e podem sofrer variações em razão de fatores externos, como logística, períodos de alta demanda, feriados, greves, condições climáticas ou procedimentos operacionais das transportadoras.Para maiores dúvidas, acesse nosso site ou fale conosco aqui mesmo.

Para mais detalhes sobre prazos e frete, acesse:

Link: https://www.trilhadosolshop.com.br/politica-de-entrega/`
    )

    return
  }

  if (texto === '5') {
    await client.sendMessage(
      msg.from,
      `💳 Formas de Pagamento:

Todos os preços são apresentados em reais (R$) e podem ser alterados sem aviso prévio.

Aceitamos as seguintes formas de pagamento:

1. Cartão de Crédito: Visa, MasterCard, American Express, Elo e Hipercard.
2. Boleto Bancário: Disponível para pagamento à vista.
3. Pix: Pagamento instantâneo via QR Code ou chave Pix.

Os pagamentos são processados por intermediadores financeiros independentes, que possuem seus próprios termos, políticas de segurança e privacidade.

https://www.trilhadosolshop.com.br/termos-de-servico/`
    )

    return
  }

  if (texto === '6') {
    await client.sendMessage(
      msg.from,
      `📦 Acompanhar Pedido:

Assim que seu pedido for enviado, você receberá um código de rastreio por e-mail.

Em pedidos enviados a partir do exterior, o rastreamento poderá apresentar atualizações intermitentes ou alterações ao ingressar no Brasil, o que não compromete a entrega do pedido.

Caso não tenha recebido o e-mail, faça login na conta e clique em "Acompanhar pedido", através do link abaixo:
https://www.trilhadosolshop.com.br/account/`
    )

    return
  }

  if (texto === '7') {
    estados[msg.from] = { etapa: 'cpf' }

    await client.sendMessage(
      msg.from,
      `Perfeito! ☀️

Para falar com o atendente, preciso de algumas informações.

📄 Digite seu CPF:`
    )

    return
  }
})
