const { getAllSettings } = require("../lib/settings.cjs");

const status = (value) => value ? "ON ✅" : "OFF ❌";
const configured = (value) => value ? "CONFIGURED ✅" : "NOT SET ❌";

module.exports = async (sock, m) => {
  const chatId = m.key.remoteJid;
  const s = getAllSettings();

  const text =
    `╭━━━〔 *${s.botName} SETTINGS* 〕━━━╮\n` +
    `┃ 👑 Developer: *${s.ownerName}*\n` +
    `┃ 🏷️ Version: *${s.version}*\n` +
    `┃ ⚙️ Mode: *${String(s.mode).toUpperCase()}*\n` +
    `┃ 🔣 Prefix: *${s.prefix}*\n` +
    `┃ 🌐 Language: *${s.language}*\n` +
    `┃ 🌍 Timezone: *${s.timezone}*\n` +
    `╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +

    `🛡️ *SECURITY*\n` +
    `• AntiLink: ${status(s.antilink)}\n` +
    `• AntiSpam: ${status(s.antiSpam)}\n` +
    `• AntiDelete: ${status(s.antiDelete)}\n` +
    `• AntiDelete Mode: *${s.antiDeleteMode}*\n\n` +

    `🤖 *AUTOMATION*\n` +
    `• AutoReact: ${status(s.autoreact)}\n` +
    `• AutoRead: ${status(s.autoread)}\n` +
    `• AutoTyping: ${status(s.autotyping)}\n` +
    `• AutoRecording: ${status(s.autorecording)}\n` +
    `• AlwaysOnline: ${status(s.alwaysonline)}\n` +
    `• Reaction Emoji: *${s.reaction}*\n\n` +

    `👥 *GROUP MESSAGES*\n` +
    `• Welcome: ${status(s.welcome)}\n` +
    `• Goodbye: ${status(s.goodbye)}\n\n` +

    `📱 *WHATSAPP STATUS*\n` +
    `• Status Enabled: ${status(s.statusEnabled)}\n` +
    `• AutoView: ${status(s.statusAutoView)}\n` +
    `• AutoReact: ${status(s.statusAutoReact)}\n` +
    `• AutoReply: ${status(s.statusAutoReply)}\n` +
    `• Status Download: ${status(s.statusDownload)}\n\n` +

    `🎨 *MEDIA*\n` +
    `• Packname: *${s.packname}*\n` +
    `• Author: *${s.author}*\n\n` +

    `🔌 *SERVICES*\n` +
    `• Gemini API: ${configured(s.geminiApiKey)}\n` +
    `• MongoDB: ${configured(s.mongodbUrl)}\n\n` +

    `╭━━━〔 *BONY-XMD* 〕━━━╮\n` +
    `┃ ⚙️ All settings from one system\n` +
    `┃ 💾 Persistent database settings\n` +
    `╰━━━━━━━━━━━━━━━━━━━━╯`;

  await sock.sendMessage(
    chatId,
    { text },
    { quoted: m }
  );
};
