const { getAllSettings } = require("../lib/settings.cjs");

const conversationHistory = new Map();
const MAX_HISTORY = 8;

const normalize = text =>
  String(text || "")
    .toLowerCase()
    .replace(/[.!?,]+$/g, "")
    .trim();

const send = (sock, m, text) =>
  sock.sendMessage(
    m.key.remoteJid,
    { text: `🤖 *BONY-XMD AI*\n\n${text}` },
    { quoted: m }
  );

function remember(chatId, role, text) {
  const history = conversationHistory.get(chatId) || [];
  history.push({ role, text });
  conversationHistory.set(chatId, history.slice(-(MAX_HISTORY * 2)));
}

function recent(chatId) {
  return conversationHistory.get(chatId) || [];
}

module.exports = async (sock, m, args) => {
  const question = args.join(" ").trim();
  const chatId = m.key.remoteJid;
  const settings = getAllSettings();
  const ownerName = settings.ownerName || "BONY KE";
  const ownerNumber = String(settings.ownerNumber || "").replace(/[^0-9]/g, "");
  const prefix = settings.prefix || ".";

  if (!question) {
    return send(
      sock,
      m,
      `Hi 👋 I'm *BONY-XMD AI*, the built-in AI assistant of *BONY-XMD*.

I was developed by *${ownerName}*.

You can chat with me naturally or ask about BONY-XMD, programming, WhatsApp bots and general topics.

🌍 I can communicate in English, Kiswahili and other languages.

🔐 I can share public BONY-XMD/developer information, but I don't reveal passwords, credentials, sessions, API keys, private messages, private files or other confidential information.`
    );
  }

  remember(chatId, "user", question);

  const q = normalize(question);

  const replies = [
    {
      test: /^(hi|hello|hey|yo|hallo|hiya)$/,
      answer: "Hello 👋 How can I help you today?"
    },
    {
      test: /^(habari|mambo|vipi)$/,
      answer: "Habari 👋 Niko vizuri! Nikusaidie nini?"
    },
    {
      test: /^(uko aje|uko vipi|habari yako)$/,
      answer: "Niko vizuri, asante! 😊 Wewe je?"
    },
    {
      test: /^(niko poa|niko vizuri|niko sawa|i am good|im good|i'm good)$/,
      answer: "Vizuri sana! 😊 Nimefurahi kusikia hivyo."
    },
    {
      test: /^(asante|shukran|thanks|thank you)$/,
      answer: "Karibu sana! 😊"
    },
    {
      test: /^(bye|goodbye|tutaonana|kwa heri)$/,
      answer: "Tutaonana 👋 Stay safe!"
    },
    {
      test: /(who|nani).*(you|wewe|are you|nani wewe)/,
      answer: `Mimi ni *BONY-XMD AI*, AI assistant wa *BONY-XMD*.

Nimetengenezwa na kuendelezwa na *${ownerName}*. 👑`
    },
    {
      test: /(who|nani).*(created|built|made|developed|creator|developer|owner|alikujenga|alitengeneza|developer wako)/,
      answer: `*${ownerName}* ndiye developer na creator wa *BONY-XMD*.

Mimi ni AI assistant wa BONY-XMD, niliyejengwa kusaidia watumiaji kwa mazungumzo na taarifa kuhusu bot.`
    },
    {
      test: /(owner number|owner phone|developer number|developer phone|namba ya owner|namba ya developer|contact.*owner|contact.*developer)/,
      answer: ownerNumber
        ? `Namba ya *${ownerName}* (developer wa BONY-XMD) ni:\n\n📱 +${ownerNumber}`
        : `Namba ya owner bado haijawekwa kwenye settings za BONY-XMD.`
    },
    {
      test: /(what is|what's|tell me about|elezea|ni nini).*(bony.?xmd|bony xmd)/,
      answer: `*BONY-XMD* ni WhatsApp bot yenye commands na automation features.

Developer: *${ownerName}*
Mode: ${settings.mode || "public"}
Prefix: ${prefix}

Tumia \`${prefix}menu\` kuona commands zinazopatikana.`
    },
    {
      test: /(how.*use|how.*command|jinsi.*tumia|nawezaje.*tumia|commands|command)/,
      answer: `Kutumia BONY-XMD ni rahisi. Anza na:

\`${prefix}menu\`

Kwa mfano:
\`${prefix}owner\`
\`${prefix}alive\`
\`${prefix}ping\`
\`${prefix}ai\``
    },
    {
      test: /(javascript|js|node\.?js)/,
      answer: "JavaScript ni lugha ya programming inayotumika sana kwenye web, automation na Node.js. BONY-XMD yenyewe hutumia Node.js. Ukiambia unachotaka kujifunza, naweza kukupa maelezo na mifano ya msingi."
    },
    {
      test: /(whatsapp bot|whatsapp bots|bot ni nini|what is a bot)/,
      answer: "WhatsApp bot ni programu inayopokea messages na kutekeleza actions automatically. BONY-XMD hutumia commands na automation features kusaidia watumiaji."
    },
    {
      test: /(help|msaada|nisaidie)/,
      answer: `Niko tayari kukusaidia 👋

Unaweza kuniuliza kuhusu BONY-XMD, programming, computers, WhatsApp bots, au maswali ya kawaida.

Kwa commands za bot tumia \`${prefix}menu\`.`
    },
    {
      test: /(good morning|morning|asubuhi)/,
      answer: "Good morning ☀️ Habari ya asubuhi! Nikusaidie nini?"
    },
    {
      test: /(good night|usiku mwema)/,
      answer: "Good night 🌙 Lala salama!"
    }
  ];

  const matched = replies.find(item => item.test.test(q));

  let answer;

  if (matched) {
    answer = matched.answer;
  } else {
    const history = recent(chatId);
    const previous = history
      .filter(item => item.role === "user")
      .slice(-3)
      .map(item => item.text);

    if (
      /(password|credential|api key|secret|session|private messages|private files|siri|credentials)/i.test(q)
    ) {
      answer =
        "Siwezi kutoa private information, passwords, credentials, API keys, WhatsApp sessions, private messages au confidential files. 🔐\n\nNaweza kusaidia kwa taarifa za jumla au za BONY-XMD ambazo si za siri.";
    } else if (previous.length > 1 && /(what|hiyo|that|it|yake|wake|endelea|continue|more)/i.test(q)) {
      answer =
        `Ninaweza kuendelea na mazungumzo yetu. Umeuliza kuhusu: *${previous[previous.length - 2]}*.\n\nNiambie sehemu gani ungependa nieleze zaidi.`;
    } else if (q.length < 4) {
      answer =
        `Niko hapa 👋 Niambie unachotaka kujua au tumia \`${prefix}menu\` kuona commands.`;
    } else {
      answer =
        "Nimekupata 👌 Kwa sasa mimi ni chatbot wa built-in wa BONY-XMD, hivyo ninaweza kusaidia kwa mazungumzo ya kawaida, BONY-XMD na mwongozo wa msingi.\n\nJaribu kuniuliza swali kwa maelezo zaidi.";
    }
  }

  remember(chatId, "assistant", answer);

  await sock.sendMessage(chatId, {
    react: { text: "🤖", key: m.key }
  });

  return send(sock, m, answer);
};
