const {
  getSetting,
  saveSettings
} = require("../lib/settings.cjs");
const { isOwner } = require("../lib/owner.cjs");

const autoreactCommand = async (sock, m, args) => {
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
          `❤️ *Auto-React*\n\n` +
          `Current: *${getSetting("autoreact") ? "ON" : "OFF"}*\n\n` +
          `Usage:\n` +
          `.autoreact on\n` +
          `.autoreact off`
      },
      { quoted: m }
    );
  }

  const value = status === "on";

  saveSettings({
    autoreact: value
  });

  await sock.sendMessage(
    chatId,
    {
      text: `❤️ *Auto-React System:* ${value ? "Activated! ✅" : "Deactivated! ❌"}`
    },
    { quoted: m }
  );
};

module.exports = autoreactCommand;
