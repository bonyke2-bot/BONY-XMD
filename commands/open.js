module.exports = async (sock, m) => {
    const chatJid = m.key.remoteJid;

    // 1. Check if the command is used in a group
    if (!chatJid.endsWith('@g.us')) {
        return await sock.sendMessage(chatJid, { text: "❌ *Error:* This command can only be used in groups!" }, { quoted: m });
    }

    try {
        // 2. Open the group (not_announcement allows everyone to speak)
        await sock.groupSettingUpdate(chatJid, 'not_announcement');

        const response = `
*╭───〔 🔓 GROUP OPENED 〕───⭐*
│
│ 📢 *Status:* Everyone can send messages now! 🥳
│ 🔓 *Access:* Unlocked for all members ✨
│ 👮 *Action by:* @${(m.sender || m.key.participant || "").split('@')[0]}
│ 🤖 *Bot:* QUEEN COLAMBIA
│
*╰──────────────⭐*
        `.trim();

        // Send confirmation with celebration emojis
        await sock.sendMessage(chatJid, { 
            text: response, 
            mentions: [m.sender || m.key.participant] 
        }, { quoted: m });

    } catch (err) {
        console.error("Group Open Error:", err);
        // Error usually occurs if the bot is not an admin
        await sock.sendMessage(chatJid, { 
            text: "⚠️ *Permission Denied:* I need to be a **Group Admin** to open this group! 🚫" 
        }, { quoted: m });
    }
}
