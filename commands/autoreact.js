const {
  getSetting,
  saveSettings
} = require("../lib/settings.cjs");

const autoreactCommand = async (sock, m, args) => {
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
