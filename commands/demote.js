const settings = require("../settings.js")

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
        
        const isOwner = sender.includes(settings.ownerNumber.replace(/[^0-9]/g, ''));
        const isAdmin = admins.includes(sender);

        if (!isOwner && !isAdmin) {
            return await sock.sendMessage(chatJid, { 
                text: "🚫 *Access Denied:* Only the **Owner** or **Group Admins** can demote others!" 
            }, { quoted: m });
        }

        // 3. Identify target user (via mention or reply)
        let user = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                   m.message?.extendedTextMessage?.contextInfo?.participant;

        if (!user) {
            return await sock.sendMessage(chatJid, { 
                text: "❓ *Usage:* Please mention (@) an Admin or reply to their message to demote them." 
            }, { quoted: m });
        }

        // 4. Execute demote action
        await sock.groupParticipantsUpdate(chatJid, [user], "demote");

        const response = `
*╭───〔 👮 ADMIN ACTION 〕───⭐*
│
│ 👤 *User:* @${user.split('@')[0]}
│ 📉 *Status:* Demoted to Member
│ 👮 *Authorized by:* @${sender.split('@')[0]}
│ 🤖 *Bot:* QUEEN COLAMBIA
│
*╰──────────────⭐*
        `.trim();

        await sock.sendMessage(chatJid, { 
            text: response, 
            mentions: [user, sender] 
        }, { quoted: m });

    } catch (err) {
        console.error("Demote Error:", err);
        await sock.sendMessage(chatJid, { 
            text: "⚠️ *Error:* I need to be a **Group Admin** to change member roles, or the user is not an admin." 
        }, { quoted: m });
    }
}
