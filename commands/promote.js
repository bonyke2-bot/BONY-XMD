module.exports = async (sock, m) => {
    const chatJid = m.key.remoteJid;

    // 1. Check if the command is used in a group
    if (!chatJid.endsWith('@g.us')) {
        return await sock.sendMessage(chatJid, { text: "❌ This command can only be used in groups!" }, { quoted: m });
    }

    try {
        // 2. Fetch group metadata to verify admins
        const groupMetadata = await sock.groupMetadata(chatJid);
        const participants = groupMetadata.participants;
        
        // List of all group admins
        const groupAdmins = participants.filter(p => p.admin !== null).map(p => p.id);
        
        // Check if the sender is an admin
        const isSenderAdmin = groupAdmins.includes(m.sender);

        // SECURITY: If the person typing is NOT an admin, stop here
        if (!isSenderAdmin) {
            return await sock.sendMessage(chatJid, { text: "❌ Access Denied! Only group admins can use this command." }, { quoted: m });
        }

        // 3. Identify the user to promote (via mention or reply)
        let user = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                   m.message?.extendedTextMessage?.contextInfo?.participant;

        if (!user) {
            return await sock.sendMessage(chatJid, { text: "❓ Please tag (@) a user or reply to their message to promote them." }, { quoted: m });
        }

        // 4. Update participant to Admin status
        await sock.groupParticipantsUpdate(chatJid, [user], "promote");

        const response = `
*╭───〔 👮 ADMIN ACTION 〕───⭐*
│
│ 👤 *User:* @${user.split('@')[0]}
│ 📈 *Status:* Promoted to Admin
│ 🤖 *Bot:* QUEEN COLAMBIA
│
*╰──────────────⭐*
        `.trim();

        await sock.sendMessage(chatJid, { text: response, mentions: [user] }, { quoted: m });

    } catch (err) {
        // This error usually happens if the bot itself is not an admin
        await sock.sendMessage(chatJid, { text: "⚠️ Error: Make sure the bot is an Admin to perform this action!" }, { quoted: m });
        console.error(err);
    }
}
