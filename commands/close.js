module.exports = async (sock, m) => {
    const chatJid = m.key.remoteJid;

    // 1. Check if the command is used in a group
    if (!chatJid.endsWith('@g.us')) {
        return await sock.sendMessage(chatJid, { text: "❌ *Error:* This command can only be used in groups!" }, { quoted: m });
    }

    try {
        // 2. Change group settings to 'announcement' (Admins only)
        await sock.groupSettingUpdate(chatJid, 'announcement');

        const response = `
*╭───〔 🔒 GROUP CLOSED 〕───⭐*
│
│ 📢 *Status:* Only Admins can send messages now.
│ 👮 *Action by:* @${(m.sender || m.key.participant || "").split('@')[0]}
│ 🤖 *Bot:* QUEEN COLAMBIA
│
*╰──────────────⭐*
        `.trim();

        await sock.sendMessage(chatJid, { 
            text: response, 
            mentions: [m.sender || m.key.participant] 
        }, { quoted: m });

    } catch (err) {
        console.error("Group Close Error:", err);
        // Error usually occurs if the bot is not an admin
        await sock.sendMessage(chatJid, { 
            text: "⚠️ *Permission Denied:* I need to be a **Group Admin** to close this group!" 
        }, { quoted: m });
    }
}
