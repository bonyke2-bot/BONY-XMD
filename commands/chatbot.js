const { getSetting, saveSettings } = require("../lib/settings.cjs");
const { isOwner } = require("../lib/owner.cjs");

module.exports = async (sock, m, args) => {
  if (!isOwner(m)) {
    return await sock.sendMessage(
      m.key.remoteJid,
      {
        text: "❌ *Only the BONY-XMD owner can change the chatbot setting.*"
      },
      { quoted: m }
    );
  }

  const action = String(args[0] || "").toLowerCase();

  if (!["on", "off"].includes(action)) {
    const current = getSetting("chatbot") === true ? "ON" : "OFF";

    return await sock.sendMessage(
      m.key.remoteJid,
      {
        text:
          `🤖 *BONY-XMD CHATBOT*\n\n` +
          `Status: *${current}*\n\n` +
          `Use:\n` +
          `• .chatbot on\n` +
          `• .chatbot off`
      },
      { quoted: m }
    );
  }

  const enabled = action === "on";
  saveSettings({ chatbot: enabled });

  return await sock.sendMessage(
    m.key.remoteJid,
    {
      text: enabled
        ? "🤖 *BONY-XMD chatbot is now ON.*\n\nI can now respond to normal messages."
        : "🤖 *BONY-XMD chatbot is now OFF.*\n\nNormal messages will not trigger the chatbot."
    },
    { quoted: m }
  );
};
