const {
  getAllSettings
} = require("../lib/settings.cjs");

module.exports = async (sock, m) => {
  const chatId = m.key.remoteJid;
  const s = getAllSettings();

  const text =
    `╭━━━〔 *BONY-XMD SETTINGS* 〕━━━╮\n` +
    `┃ ⚙️ Mode: *${s.mode.toUpperCase()}*\n` +
    `┃ 🔣 Prefix: *${s.prefix}*\n` +
    `┃ 📖 AutoRead: *${s.autoread ? "ON" : "OFF"}*\n` +
    `┃ ❤️ AutoReact: *${s.autoreact ? "ON" : "OFF"}*\n` +
    `┃ ⌨️ AutoTyping: *${s.autotyping ? "ON" : "OFF"}*\n` +
    `┃ 🎙️ AutoRecording: *${s.autorecording ? "ON" : "OFF"}*\n` +
    `┃ 🟢 AlwaysOnline: *${s.alwaysonline ? "ON" : "OFF"}*\n` +
    `┃ 🛡️ AntiLink: *GROUP SETTINGS*\n` +
    `┃ 👋 Welcome: *${s.welcome ? "ON" : "OFF"}*\n` +
    `┃ 👋 Goodbye: *${s.goodbye ? "ON" : "OFF"}*\n` +
    `┃ 💖 Reaction: *${s.reaction}*\n` +
    `╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

  await sock.sendMessage(
    chatId,
    { text },
    { quoted: m }
  );
};
