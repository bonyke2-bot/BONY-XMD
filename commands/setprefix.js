const {
  getSetting,
  saveSettings
} = require("../lib/settings.cjs");

module.exports = async (sock, m, args) => {
  const from = m.key.remoteJid;
  const sender = m.key.participant || m.key.remoteJid;

  // Verify owner
  const ownerNumber = String(
    getSetting("ownerNumber") || ""
  ).replace(/[^0-9]/g, "");

  const senderNumber = String(sender || "")
    .replace(/[^0-9]/g, "");

  const isOwner =
    m.key.fromMe ||
    senderNumber === ownerNumber;

  if (!isOwner) {
    return await sock.sendMessage(
      from,
      {
        text: "❌ *Access Denied:* Only the Bot Owner can use this command."
      },
      { quoted: m }
    );
  }

  // Check new prefix
  if (!args[0]) {
    const currentPrefix = getSetting("prefix") || ".";

    const errorText =
      `╭━━━〔 *INVALID USAGE* 〕━━━⬣\n` +
      `┃ ❌ *Missing new prefix!*\n` +
      `┃\n` +
      `┃ 📌 *Usage:* \`${currentPrefix}setprefix [new_prefix]\`\n` +
      `┃ 💡 *Example:* \`${currentPrefix}setprefix !\`\n` +
      `╰━━━━━━━━━━━━━━━━━━━━⬣`;

    return await sock.sendMessage(
      from,
      { text: errorText },
      { quoted: m }
    );
  }

  const newPrefix = args[0];

  try {
    saveSettings({
      prefix: newPrefix
    });

    const successText =
      `╭━━━〔 *PREFIX UPDATED* 〕━━━⬣\n` +
      `┃ ✅ *New Prefix:* \`${newPrefix}\`\n` +
      `┃ 💾 *Status:* \`Saved successfully\`\n` +
      `╰━━━━━━━━━━━━━━━━━━━━⬣`;

    await sock.sendMessage(
      from,
      { text: successText },
      { quoted: m }
    );

  } catch (error) {
    console.error("SetPrefix Error:", error);

    await sock.sendMessage(
      from,
      {
        text: "❌ *Error:* Failed to save the new prefix."
      },
      { quoted: m }
    );
  }
};
