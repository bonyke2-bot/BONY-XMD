const { getSetting, saveSettings } = require("../lib/settings.cjs");

const autoViewStatusCommand = async (sock, m, args) => {
  const status = (args[0] || "").toLowerCase();

  if (!["on", "off"].includes(status)) {
    return await sock.sendMessage(
      m.key.remoteJid,
      {
        text:
          `👀 *Status AutoView*\n\n` +
          `Current: *${getSetting("statusAutoView") ? "ON ✅" : "OFF ❌"}*\n\n` +
          `Use:\n` +
          `.autoviewstatus on\n` +
          `.autoviewstatus off`
      },
      { quoted: m }
    );
  }

  const value = status === "on";

  saveSettings({
    statusAutoView: value
  });

  await sock.sendMessage(
    m.key.remoteJid,
    {
      text:
        `👀 *Status AutoView:* ` +
        `${value ? "Activated! ✅" : "Deactivated! ❌"}`
    },
    { quoted: m }
  );
};

module.exports = autoViewStatusCommand;
