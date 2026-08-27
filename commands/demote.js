const settings = require("../settings.js");

module.exports = async (sock, m, args) => {
    const chatJid = m.key.remoteJid;
    const sender = m.key.participant || m.key.remoteJid;

    // 1. Group check
    if (!chatJid.endsWith('@g.us')) {
        return await sock.sendMessage(chatJid, { text: "❌ *Error:* This command only works in groups." }, { quoted: m });
    }

    try {
        // 2. SECURITY CHECK (Only Owner or Admins can demote)
        const groupMetadata = await sock.groupMetadata(chatJid);
        const admins = groupMetadata.participants.filter(p => p.admin !== null).map(p => p.id);
        
        const ownerNum = settings.ownerNumber.replace(/[^0-9]/g, '');
        const isOwner = sender.includes(ownerNum) || m.key.fromMe;
        const isAdmin = admins.includes(sender);

        if (!isOwner && !isAdmin) {
            return await sock.sendMessage(chatJid, { 
                text: "🚫 *Access Denied:* Only the **Owner** or **Group Admins** can demote others!" 
            }, { quoted: m });
        }

        // 3. Identify target user (Improved for modern Baileys structure)
        const quoted = m.quoted || m.msg?.contextInfo;
        let user = m.mentionedJid?.[0] || quoted?.mentionedJid?.[0] || quoted?.participant;

        if (!user) {
            return await sock.sendMessage(chatJid, { 
                text: `❓ *Usage:* Please mention (@) an Admin or reply to their message to demote them.` 
            }, { quoted: m });
        }

        // 4. Execute demote action
        await sock.groupParticipantsUpdate(chatJid, [user], "demote");

        // 5. Clean Modern Response
        const response = `╭━━━〔 *ADMIN ACTION* 〕━━━⬣
┃ 👤 *User:* @${user.split('@')[0]}
┃ 📉 *Status:* Demoted to Member
┃ 👮 *Authorized by:* @${sender.split('@')[0]}
╰━━━━━━━━━━━━━━━━━━━━⬣`.trim();

        await sock.sendMessage(chatJid, { 
            text: response, 
            mentions: [user, sender] 
        }, { quoted: m });

    } catch (err) {
        console.error("Demote Error:", err);
        await sock.sendMessage(chatJid, { 
            text: "⚠️ *Error:* Make sure I am a **Group Admin** and the target user is an admin." 
        }, { quoted: m });
    }
};
