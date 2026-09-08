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
        const participants = groupMetadata.participants;
        const admins = participants.filter(p => p.admin !== null).map(p => p.id);
        
        const ownerNum = settings.ownerNumber.replace(/[^0-9]/g, '');
        const isOwner = sender.includes(ownerNum) || m.key.fromMe;
        const isAdmin = admins.includes(sender);

        if (!isOwner && !isAdmin) {
            return await sock.sendMessage(chatJid, { 
                text: "🚫 *Access Denied:* Only the **Owner** or **Group Admins** can demote others!" 
            }, { quoted: m });
        }

        // 3. Identify target user (Robust detection for Baileys)
        let user = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                   m.message?.extendedTextMessage?.contextInfo?.participant;

        if (!user && args[0]) {
            user = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        }

        if (!user) {
            return await sock.sendMessage(chatJid, { 
                text: `❓ *Usage:* Please mention (@) an Admin or reply to their message to demote them.` 
            }, { quoted: m });
        }

        // 4. Check if bot is admin
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const isBotAdmin = admins.includes(botId);

        if (!isBotAdmin) {
            return await sock.sendMessage(chatJid, { text: "❌ *Error:* Please make me a **Group Admin** first!" }, { quoted: m });
        }

        // 5. Execute demote action
        await sock.groupParticipantsUpdate(chatJid, [user], "demote");

        // 6. Clean Modern Response (Updated with BONY-XMD)
        const response = `╭━━━〔 *BONY-XMD ADMIN ACTION* 〕━━━⬣
┃ 👤 *User:* @${user.split('@')[0]}
┃ 📉 *Status:* Demoted to Member
┃ 🤖 *Bot:* BONY-XMD
┃ 👮 *Authorized by:* @${sender.split('@')[0]}
╰━━━━━━━━━━━━━━━━━━━━⬣`.trim();

        await sock.sendMessage(chatJid, { 
            text: response, 
            mentions: [user, sender] 
        }, { quoted: m });

    } catch (err) {
        console.error("Demote Error:", err);
        await sock.sendMessage(chatJid, { 
            text: "⚠️ *Error:* Failed to demote the user. Make sure they are currently an admin." 
        }, { quoted: m });
    }
};
