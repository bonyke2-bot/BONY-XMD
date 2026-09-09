const {
  getSetting,
  saveSettings
} = require("../lib/settings.cjs");

const alwaysOnlineCommand = async (sock, m, args) => {
  const chatId = m.key.remoteJid;
  const status = args[0]?.toLowerCase();

  if (!["on", "off"].includes(status)) {
    return await sock.sendMessage(
      chatId,
      {
        text:
          `🟢 *Always Online*\n\n` +
          `Current: *${getSetting("alwaysonline") ? "ON" : "OFF"}*\n\n` +
          `Usage:\n` +
          `!alwaysonline on\n` +
          `!alwaysonline off`
      },
      { quoted: m }
    );
  }

  const value = status === "on";

  saveSettings({
    alwaysonline: value
  });

  if (value) {
    try {
      await sock.sendPresenceUpdate("available");
    } catch (error) {
      console.error("⚠️ Always Online error:", error.message);
    }
  }

  await sock.sendMessage(
    chatId,
    {
      text: `🟢 *Always Online:* ${value ? "Activated! ✅" : "Deactivated! ❌"}`
    },
    { quoted: m }
  );
};

module.exports = alwaysOnlineCommand;
