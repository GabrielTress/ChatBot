// =============================
// BOT WHATSAPP - TRILHA DO SOL
// VERSÃO ESTÁVEL 2026
// =============================

const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');

//const NUMERO_ATENDENTE = '5547991919840@c.us';
const estados = {};
let botIniciadoEm = Math.floor(Date.now() / 1000);

// =============================
// CONFIGURAÇÃO DO CLIENTE
// =============================

const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "bot-trilha-do-sol"
    }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});



// =============================
// EVENTOS DE CONEXÃO
// =============================

client.on('qr', qr => {
    console.log('📱 Escaneie o QR Code abaixo:\n');
    qrcode.generate(qr, { small: true });
});

client.on('authenticated', () => {
    console.log('✅ Autenticado com sucesso!');
});

client.on('ready', () => {
    console.log('🚀 WhatsApp conectado com sucesso!');
});

client.on('auth_failure', msg => {
    console.error('❌ Falha na autenticação:', msg);
});

client.on('disconnected', async reason => {
    console.log('⚠️ Cliente desconectado:', reason);
    console.log('🔄 Tentando reconectar...');
    await client.initialize();
});

client.initialize();

// =============================
// FUNÇÃO DELAY
// =============================

const delay = ms => new Promise(res => setTimeout(res, ms));

// =============================
// EVENTO PRINCIPAL
// =============================

client.on('message', async msg => {

    // ❌ Ignorar mensagens do próprio bot
    if (msg.fromMe) return;

    // ❌ Ignorar grupos
    if (!msg.from.endsWith('@c.us')) return;

    // ❌ Ignorar mensagens antigas
    if (msg.timestamp < botIniciadoEm) return;

    if (!msg.body) return;

    const chat = await msg.getChat();
    const texto = msg.body.trim();

    // =============================
    // FLUXO ATENDENTE (PRIORIDADE)
    // =============================

    if (estados[msg.from]?.etapa === 'cpf') {
        estados[msg.from].cpf = texto;
        estados[msg.from].etapa = 'email';
        await client.sendMessage(msg.from, '📧 Agora digite seu Email:');
        return;
    }

    if (estados[msg.from]?.etapa === 'email') {
        estados[msg.from].email = texto;
        estados[msg.from].etapa = 'pedido';
        await client.sendMessage(msg.from, '📦 Digite o Número do Pedido:');
        return;
    }

    if (estados[msg.from]?.etapa === 'pedido') {
        estados[msg.from].pedido = texto;

            const contato = await msg.getContact();

            const nomeCliente =
                contato.pushname ||
                contato.name ||
                contato.number;

            const numeroCliente = contato.number;

            const resumo =
            `📞 *NOVO ATENDIMENTO*\n\n` +
            `👤 Cliente: ${nomeCliente}\n` +
            `📄 CPF: ${estados[msg.from].cpf}\n` +
            `📧 Email: ${estados[msg.from].email}\n` +
            `📱 Número: https://wa.me/55${numeroCliente}\n` +
            `📦 Pedido: ${estados[msg.from].pedido}`;

         
        try {
            const numberId = await client.getNumberId('5547991919840');

            if (!numberId) {
                throw new Error('Número não encontrado no WhatsApp');
            }

            await client.sendMessage(numberId._serialized, resumo);

        } catch (error) {
            console.error('Erro ao enviar para atendente:', error);

            await client.sendMessage(msg.from,
                '⚠️ Não consegui encaminhar para o atendente agora.\nTente novamente em instantes.'
            );
        }

        await client.sendMessage(msg.from,
            'Obrigado! ☀️\n\n' +
            'Já enviei suas informações para nosso atendente.\n' +
            'Em instantes ele continuará o atendimento por aqui.'
        );

        delete estados[msg.from];
        return;

    
    }

    // =============================
    // MENU PRINCIPAL
    // =============================

    if (texto.match(/(menu|oi|olá|ola|bom dia|boa tarde|boa noite|fiz|bom diaa|pedido|comprei)/i)) {

        await delay(1500);
        await chat.sendStateTyping();
        await delay(1500);

        const contact = await msg.getContact();
        const nome = contact.pushname || "Cliente";

        await client.sendMessage(msg.from,
            `Olá, ${nome.split(" ")[0]}! 👋\n\n` +
            `Sou o Sunny ☀️, assistente virtual da *Trilha do Sol Shop*.\n\n` +
            `Como podemos te ajudar?\n\n` +
            `1 - 🏕️ Produtos para Camping\n` +
            `2 - 🌊 Produtos para Praia\n` +
            `3 - 🔥 Ofertas\n` +
            `4 - 🚚 Prazo e Frete\n` +
            `5 - 💳 Formas de Pagamento\n` +
            `6 - 📦 Acompanhar Pedido\n` +
            `7 - ❓ Falar com Atendente`
        );
    }

    else if (texto === '1') {
        await client.sendMessage(msg.from,
            `🏕️ Produtos para Camping:\n\n` +
            `Nosso site oferece vários artigos para camping.\n\n` +
            `Link: https://www.trilhadosolshop.com.br/camping/`
        );
    }

    else if (texto === '2') {
        await client.sendMessage(msg.from,
            `🌊 Produtos para Praia:\n\n` +
            `Nosso site oferece vários artigos para praia.\n\n` +
            `Link: https://www.trilhadosolshop.com.br/praia/`
        );
    }

    else if (texto === '3') {
        await client.sendMessage(msg.from,
            `🔥 Ofertas Imperdíveis:\n\n` +
         `Link: https://www.trilhadosolshop.com.br/promocoes/`
        );
    }

    else if (texto === '4') {
        await client.sendMessage(msg.from,
            `🚚 Prazos e Frete:\n\n` +
            `O prazo de entrega passa a contar após a confirmação do pagamento e a postagem do pedido.\n\n` +
            `📦 Produtos enviados a partir do Brasil:` +
             ` Prazo estimado: 5 a 15 dias úteis.\n\n` +
             `🌍Produtos enviados a partir do exterior:`+
             ` Prazo estimado: 15 a 45 dias úteis. \n\n`+
            `Os prazos informados são estimativas e podem sofrer variações em razão de fatores externos, como logística, períodos de alta demanda, feriados, greves, condições climáticas ou procedimentos operacionais das transportadoras.`+
            `Para maiores dúvidas, acesse nosso site ou fale conosco aqui mesmo.\n\n` +
            `Para mais detalhes sobre prazos e frete, acesse:\n\n` +
            `Link: https://www.trilhadosolshop.com.br/politica-de-entrega/`
        );
    }

    else if (texto === '5') {
        await client.sendMessage(msg.from,
            `💳 Formas de Pagamento:\n\n` +
            `Todos os preços são apresentados em reais (R$) e podem ser alterados sem aviso prévio.\n\n` +
            `Aceitamos as seguintes formas de pagamento:\n\n` +
            `1. Cartão de Crédito: Visa, MasterCard, American Express, Elo e Hipercard.\n` +
            `2. Boleto Bancário: Disponível para pagamento à vista.\n` +
            `3. Pix: Pagamento instantâneo via QR Code ou chave Pix.\n\n` +
            `Os pagamentos são processados por intermediadores financeiros independentes, que possuem seus próprios termos, políticas de segurança e privacidade.\n\n` +
            `https://www.trilhadosolshop.com.br/termos-de-servico/`
        );
    }

    else if (texto === '6') {
        await client.sendMessage(msg.from,
              `📦 Acompanhar Pedido:\n\n` +
            `Assim que seu pedido for enviado, você receberá um código de rastreio por e-mail.\n\n` +
            `Em pedidos enviados a partir do exterior, o rastreamento poderá apresentar atualizações intermitentes ou alterações ao ingressar no Brasil, o que não compromete a entrega do pedido.\n\n` +
            `Caso não tenha recebido o e-mail, faça login na conta e clique em "Acompanhar pedido", através do link abaixo:\n` +
            `https://www.trilhadosolshop.com.br/account/`
        );
    }

    else if (texto === '7') {
        estados[msg.from] = { etapa: 'cpf' };
        await client.sendMessage(msg.from,
            `Perfeito! ☀️\n\n` +
            `Para falar com o atendente, preciso de algumas informações.\n\n` +
            `📄 Digite seu CPF:`
        );
    }

});