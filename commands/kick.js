const settings = require("../settings.js") 

module.exports = async (sock, m, args) => {
    const chatJid = m.key.remoteJid;
    const sender = m.key.participant || m.key.remoteJid;

    // 1. Group check
    if (!chatJid.endsWith('@g.us')) return;

    try {
        // 2. SECURITY CHECK (Only Owner or Admins can kick)
        const groupMetadata = await sock.groupMetadata(chatJid);
        const admins = groupMetadata.participants.filter(p => p.admin !== null).map(p => p.id);
        
        const isOwner = sender.includes(settings.ownerNumber.replace(/[^0-9]/g, ''));
        const isAdmin = admins.includes(sender);

        if (!isOwner && !isAdmin) {
            return await sock.sendMessage(chatJid, { 
                text: "🚫 *Access Denied:* Only the **Owner** or **Group Admins** can use this command!" 
            }, { quoted: m });
        }

        // 3. Identify the user to kick
        const quoted = m.message?.extendedTextMessage?.contextInfo?.participant;
        const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        const userToKick = quoted || mentioned || (args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null);

        if (!userToKick) {
            return await sock.sendMessage(chatJid, { 
                text: "❓ *Usage:* Please reply to a message or tag a user to remove them." 
            }, { quoted: m });
        }

        // 4. Execute the removal
        await sock.groupParticipantsUpdate(chatJid, [userToKick], "remove");

        const response = `
*╭───〔 🛡️ USER REMOVED 〕───⭐*
│
│ 👤 *Target:* @${userToKick.split('@')[0]}
│ 👮 *Authorized by:* @${sender.split('@')[0]}
│ 🤖 *Bot:* QUEEN COLAMBIA
│
*╰──────────────⭐*
        `.trim();

        await sock.sendMessage(chatJid, { 
            text: response, 
            mentions: [userToKick, sender] 
        }, { quoted: m });

    } catch (err) {
        console.error("Kick Command Error:", err);
        await sock.sendMessage(chatJid, { 
            text: "⚠️ *Error:* I need to be a **Group Admin** to remove members!" 
        }, { quoted: m });
    }
}
