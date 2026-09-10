const { getAllSettings, saveSettings } = require("../lib/settings.cjs");

module.exports = async (sock, m, args) => {
  const from = m.key.remoteJid;
  const settings = getAllSettings();

  const sender = m.key.participant || from;
  const senderNumber = sender.replace(/[^0-9]/g, "");
  const ownerNumber = settings.ownerNumber.replace(/[^0-9]/g, "");

  const isOwner =
    m.key.fromMe ||
    senderNumber === ownerNumber;

  if (!isOwner) {
    return await sock.sendMessage(
      from,
      {
        text: "❌ *Only the BONY-XMD owner can change Anti-Delete settings.*"
      },
      { quoted: m }
    );
  }

  const action = args[0]?.toLowerCase();

  if (!["on", "off"].includes(action)) {
    const status = settings.antiDelete ? "ON ✅" : "OFF ❌";

    return await sock.sendMessage(
      from,
      {
        text:
          "🗑️ *BONY-XMD ANTI-DELETE*\n\n" +
          `Current status: *${status}*\n\n` +
          "Usage:\n" +
          ".antidelete on\n" +
          ".antidelete off"
      },
      { quoted: m }
    );
  }

  const enabled = action === "on";

  saveSettings({
    antiDelete: enabled
  });

  return await sock.sendMessage(
    from,
    {
      text:
        "╭━━━〔 *ANTI-DELETE* 〕━━━╮\n" +
        `┃ 🗑️ Status: *${enabled ? "ON ✅" : "OFF ❌"}*\n` +
        "┃ 🤖 BONY-XMD\n" +
        `┃ 📥 Delete forwarding: *${enabled ? "Enabled" : "Disabled"}*\n` +
        "╰━━━━━━━━━━━━━━━━━━━━╯"
    },
    { quoted: m }
  );
};
