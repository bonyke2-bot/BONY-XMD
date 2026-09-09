const {
  getSetting,
  saveSettings
} = require("../lib/settings.cjs");

const autorecordingCommand = async (sock, m, args) => {
  const chatId = m.key.remoteJid;
  const status = args[0]?.toLowerCase();

  if (!["on", "off"].includes(status)) {
    return await sock.sendMessage(
      chatId,
      {
        text:
          `🎙️ *Auto-Recording*\n\n` +
          `Current: *${getSetting("autorecording") ? "ON" : "OFF"}*\n\n` +
          `Usage:\n` +
          `!autorecording on\n` +
          `!autorecording off`
      },
      { quoted: m }
    );
  }

  const value = status === "on";

  saveSettings({
    autorecording: value
  });

  await sock.sendMessage(
    chatId,
    {
      text: `🎙️ *Auto-Recording System:* ${value ? "Activated! ✅" : "Deactivated! ❌"}`
    },
    { quoted: m }
  );
};

module.exports = autorecordingCommand;
