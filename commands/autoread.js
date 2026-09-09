const {
  getSetting,
  saveSettings
} = require("../lib/settings.cjs");

const autoreadCommand = async (sock, m, args) => {
  const chatId = m.key.remoteJid;
  const status = args[0]?.toLowerCase();

  if (!["on", "off"].includes(status)) {
    return await sock.sendMessage(
      chatId,
      {
        text:
          `📖 *Auto-Read*\n\n` +
          `Current: *${getSetting("autoread") ? "ON" : "OFF"}*\n\n` +
          `Usage:\n` +
          `!autoread on\n` +
          `!autoread off`
      },
      { quoted: m }
    );
  }

  const value = status === "on";

  saveSettings({
    autoread: value
  });

  await sock.sendMessage(
    chatId,
    {
      text: `📖 *Auto-Read System:* ${value ? "Activated! ✅" : "Deactivated! ❌"}`
    },
    { quoted: m }
  );
};

module.exports = autoreadCommand;
