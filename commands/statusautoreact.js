const { getSetting, saveSettings } = require("../lib/settings.cjs");

const statusAutoReactCommand = async (sock, m, args) => {
  const status = (args[0] || "").toLowerCase();

  if (!["on", "off"].includes(status)) {
    return await sock.sendMessage(
      m.key.remoteJid,
      {
        text:
          `❤️ *Status AutoReact*\n\n` +
          `Current: *${getSetting("statusAutoReact") ? "ON" : "OFF"}*\n\n` +
          `Use:\n` +
          `.statusautoreact on\n` +
          `.statusautoreact off`
      },
      { quoted: m }
    );
  }

  const value = status === "on";
  saveSettings({ statusAutoReact: value });

  await sock.sendMessage(
    m.key.remoteJid,
    {
      text: `❤️ *Status AutoReact:* ${value ? "Activated! ✅" : "Deactivated! ❌"}`
    },
    { quoted: m }
  );
};

module.exports = statusAutoReactCommand;
