module.exports = async (sock, m) => {
    const chatJid = m.key.remoteJid;

    // 1. Check if the command is used in a group
    if (!chatJid.endsWith('@g.us')) {
        return await sock.sendMessage(chatJid, { 
            text: "❌ *Error:* This command can only be used in groups!" 
        }, { quoted: m });
    }

    try {
        // 2. Fetch the group invite code
        const code = await sock.groupInviteCode(chatJid);
        const groupLink = `https://chat.whatsapp.com/${code}`;

        const response = `
*╭───〔 🔗 GROUP LINK 〕───⭐*
│
│ 📌 *Invite Link:* ${groupLink}
│ 👑 *Bot:* QUEEN COLAMBIA
│
*╰──────────────⭐*
        `.trim();

        // 3. Send the link with a professional Preview Card
        await sock.sendMessage(chatJid, { 
            text: response,
            contextInfo: {
                externalAdReply: {
                    title: "GROUP INVITATION",
                    body: "Click to join the group",
                    thumbnailUrl: "https://files.catbox.moe/3dwe96.jpg",
                    sourceUrl: groupLink,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: m });

    } catch (err) {
        console.error("Group Link Error:", err);
        // Usually fails if the bot is not an admin
        await sock.sendMessage(chatJid, { 
            text: "⚠️ *Permission Denied:* I cannot fetch the link. Make sure I am a **Group Admin**!" 
        }, { quoted: m });
    }
}
