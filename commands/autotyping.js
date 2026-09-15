const {
  getSetting,
  saveSettings
} = require("../lib/settings.cjs");
const { isOwner } = require("../lib/owner.cjs");

const autotypingCommand = async (sock, m, args) => {
  if (!isOwner(m)) {
    return await sock.sendMessage(
      m.key.remoteJid,
      { text: "❌ *Only the BONY-XMD owner can change this setting.*" },
      { quoted: m }
    );
  }

  const chatId = m.key.remoteJid;
  const status = args[0]?.toLowerCase();

  if (!["on", "off"].includes(status)) {
    return await sock.sendMessage(
      chatId,
      {
        text:
          `⌨️ *Auto-Typing*\n\n` +
          `Current: *${getSetting("autotyping") ? "ON" : "OFF"}*\n\n` +
          `Usage:\n` +
          `.autotyping on\n` +
          `.autotyping off`
      },
      { quoted: m }
    );
  }

  const value = status === "on";

  saveSettings({
    autotyping: value
  });

  await sock.sendMessage(
    chatId,
    {
      text: `⌨️ *Auto-Typing System:* ${value ? "Activated! ✅" : "Deactivated! ❌"}`
    },
    { quoted: m }
  );
};

module.exports = autotypingCommand;
