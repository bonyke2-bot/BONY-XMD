const { getSetting } = require("../lib/settings.cjs");

module.exports = async (sock, msg, args) => {
  const jid = msg.key.remoteJid;

  const text =
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    "";

  const word =
    args?.join(" ").trim() ||
    text.trim().split(/\s+/).slice(1).join(" ");

  if (!word) {
    return sock.sendMessage(
      jid,
      {
        text:
          "📖 *BONY XMD DICTIONARY*\n\n" +
          "Usage: `" + (getSetting("prefix") || ".") + "define <word>`\n\n" +
          "Example:\n`" + (getSetting("prefix") || ".") + "define beautiful`"
      },
      { quoted: msg }
    );
  }

  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
    );

    if (!response.ok) {
      throw new Error("Word not found");
    }

    const data = await response.json();
    const entry = data[0];
    const meanings = entry.meanings || [];

    let result =
      `📖 *BONY XMD DICTIONARY*\n\n` +
      `🔤 Word: *${entry.word}*\n`;

    for (const meaning of meanings.slice(0, 2)) {
      result += `\n📚 *${meaning.partOfSpeech || "Meaning"}*\n`;

      for (const definition of (meaning.definitions || []).slice(0, 2)) {
        result += `• ${definition.definition}\n`;
      }
    }

    await sock.sendMessage(
      jid,
      { text: result },
      { quoted: msg }
    );

  } catch (error) {
    console.error("Define error:", error.message);

    await sock.sendMessage(
      jid,
      {
        text: `❌ I couldn't find a definition for *${word}*.`
      },
      { quoted: msg }
    );
  }
};
