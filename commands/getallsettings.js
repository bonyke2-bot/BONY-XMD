const { getAllSettings } = require("../lib/settings.cjs");

module.exports = async (sock, msg) => {
  const s = getAllSettings();

  const text = `⚙️ *BONY XMD — ALL SETTINGS*

📌 *General*
• Mode: ${s.mode}
• Prefix: ${s.prefix}
• AntiLink: ${s.antilink ? "ON ✅" : "OFF ❌"}

🤖 *Bot Automation*
• AutoReact: ${s.autoreact ? "ON ✅" : "OFF ❌"}
• AutoRead: ${s.autoread ? "ON ✅" : "OFF ❌"}
• AutoTyping: ${s.autotyping ? "ON ✅" : "OFF ❌"}
• AutoRecording: ${s.autorecording ? "ON ✅" : "OFF ❌"}
• AlwaysOnline: ${s.alwaysonline ? "ON ✅" : "OFF ❌"}

👥 *Messages*
• Welcome: ${s.welcome ? "ON ✅" : "OFF ❌"}
• Goodbye: ${s.goodbye ? "ON ✅" : "OFF ❌"}

❤️ *AutoReact Emojis*
• ${Array.isArray(s.reaction) ? s.reaction.join(" ") : s.reaction}

📱 *Status*
• Status Enabled: ${s.statusEnabled ? "ON ✅" : "OFF ❌"}
• Status AutoView: ${s.statusAutoView ? "ON ✅" : "OFF ❌"}
• Status AutoReact: ${s.statusAutoReact ? "ON ✅" : "OFF ❌"}
• Status AutoReply: ${s.statusAutoReply ? "ON ✅" : "OFF ❌"}
• Status Download: ${s.statusDownload ? "ON ✅" : "OFF ❌"}

💝 *Status Reaction Emojis*
• ${Array.isArray(s.statusReaction) ? s.statusReaction.join(" ") : s.statusReaction}

👑 *BONY XMD*
• Developer: BONY KE
• Version: 2.0.0`;

  await sock.sendMessage(
    msg.key.remoteJid,
    { text },
    { quoted: msg }
  );
};
