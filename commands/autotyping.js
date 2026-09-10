const {
  getSetting,
  saveSettings
} = require("../lib/settings.cjs");

const autotypingCommand = async (sock, m, args) => {
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
