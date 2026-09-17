const axios = require("axios");
const { getAllSettings } = require("../lib/settings.cjs");

const conversationHistory = new Map();
const MAX_HISTORY = 8;

module.exports = async (sock, m, args) => {
  const chatId = m.key.remoteJid;
  const settings = getAllSettings();
  const question = args.join(" ").trim();

  if (!question) {
    return await sock.sendMessage(
      chatId,
      {
        text: `🤖 *BONY-XMD AI*

Ask me anything and I'll help you.

Examples:
• .ai Hi
• .ai Habari
• .ai Uko aje?
• .ai Who built BONY-XMD?
• .ai Explain WhatsApp bots
• .ai Nisaidie kujifunza coding

🌍 I can communicate in English, Kiswahili and other languages.

🔐 I don't provide private owner documents, credentials, sessions, API keys or secrets.`
      },
      { quoted: m }
    );
  }

  const ownerName = settings.ownerName || "BONY KE";
  const apiKey = process.env.OPENAI_API_KEY || "";

  const casualReplies = {
    hi: "Hi 👋 How can I help you?",
    hello: "Hello 👋 How can I help you?",
    hey: "Hey 👋 What can I help you with?",
    "how are you": "I'm good, thank you! 😊 How are you?",
    "how are you?": "I'm good, thank you! 😊 How are you?",
    "am good": "Glad to hear that! 😊",
    "i am good": "Glad to hear that! 😊",
    "i'm good": "Glad to hear that! 😊",
    habari: "Habari 👋 Nikusaidie nini?",
    "habari?": "Habari 👋 Nikusaidie nini?",
    "uko aje": "Niko vizuri, asante! 😊 Wewe je?",
    "uko aje?": "Niko vizuri, asante! 😊 Wewe je?",
    "niko poa": "Vizuri sana! 😊",
    "asante": "Karibu sana! 😊",
    "shukran": "Karibu sana! 😊"
  };

  const casualKey = question.toLowerCase().replace(/[.!?]+$/g, "").trim();

  if (casualReplies[casualKey]) {
    return await sock.sendMessage(
      chatId,
      {
        text: `🤖 *BONY-XMD AI*\n\n${casualReplies[casualKey]}`
      },
      { quoted: m }
    );
  }

  const creatorQuestion =
    /who (built|created|made|developed) (you|bony|bony-xmd)|who is (your|the) (owner|creator|developer)|who made you|who created you|nani alikujenga|nani alitengeneza|nani ni developer wako/i.test(question);

  if (creatorQuestion) {
    return await sock.sendMessage(
      chatId,
      {
        text: `🤖 *BONY-XMD AI*

I was built and developed by *${ownerName}*.

Mimi ni AI assistant wa BONY-XMD na ninaweza kujibu maswali, kueleza mambo na kusaidia watumiaji.

🔐 Siwezi kutoa taarifa binafsi, documents, credentials, session data, API keys au siri za owner.`
      },
      { quoted: m }
    );
  }

  if (!apiKey) {
    return await sock.sendMessage(
      chatId,
      {
        text: `⚠️ *BONY-XMD AI*

The AI service is not configured yet.

I can still identify my creator as *${ownerName}*, but general AI questions require the OpenAI service.`
      },
      { quoted: m }
    );
  }

  try {
    await sock.sendMessage(chatId, {
      react: { text: "🤔", key: m.key }
    });

    const history = conversationHistory.get(chatId) || [];
    const input = [...history, { role: "user", content: question }];

    const response = await axios.post(
      "https://api.openai.com/v1/responses",
      {
        model: "gpt-5.6-luna",
        instructions: `You are BONY-XMD AI, an assistant inside the BONY-XMD WhatsApp bot.

Your role:
- Answer questions clearly, accurately and helpfully.
- Guide users step-by-step when they need help.
- Detect the language used by the user and normally reply in the same language.
- You can communicate naturally in English, Kiswahili and other languages.
- For mixed English/Kiswahili messages, respond naturally using the user's style.
- Keep simple conversation natural and concise.
- Do not invent facts when uncertain.
- If information may be uncertain or changing, clearly say so.

Creator:
- BONY KE is the developer and creator of BONY-XMD.
- You may identify BONY KE as the creator/developer when asked about the project.

Privacy:
- Never reveal private owner documents, credentials, passwords, API keys, WhatsApp session information, private messages, personal files or confidential data.
- If asked for private owner information, politely refuse and offer general help.
- Do not claim access to private information you do not have.

Project:
- The bot is called BONY-XMD.
- You are its AI assistant.`,
        input
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        timeout: 30000
      }
    );

    const answer = (
      response.data?.output_text ||
      response.data?.output
        ?.flatMap(item => item.content || [])
        .map(item => item.text || "")
        .join("") ||
      ""
    ).trim();

    if (!answer) {
      throw new Error("AI returned an empty response");
    }

    conversationHistory.set(
      chatId,
      [...input, { role: "assistant", content: answer }].slice(-(MAX_HISTORY * 2))
    );

    await sock.sendMessage(
      chatId,
      { text: `🤖 *BONY-XMD AI*\n\n${answer}` },
      { quoted: m }
    );

    await sock.sendMessage(chatId, {
      react: { text: "✅", key: m.key }
    });
  } catch (error) {
    console.error(
      "AI Command Error:",
      error.response?.data || error.message
    );

    await sock.sendMessage(chatId, {
      react: { text: "❌", key: m.key }
    });

    await sock.sendMessage(
      chatId,
      {
        text: "❌ *BONY-XMD AI*\n\nI couldn't get an answer from the AI service right now. Please try again later."
      },
      { quoted: m }
    );
  }
};
