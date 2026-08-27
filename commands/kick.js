const settings = require("../settings.js");

module.exports = async (sock, m, args) => {
    const chatJid = m.key.remoteJid;
    const sender = m.key.participant || m.key.remoteJid;

    // 1. Group check
    if (!chatJid.endsWith('@g.us')) return;

    try {
        // 2. SECURITY CHECK (Only Owner or Admins can kick)
        const groupMetadata = await sock.groupMetadata(chatJid);
        const admins = groupMetadata.participants.filter(p => p.admin !== null).map(p => p.id);
        
        const ownerNum = settings.ownerNumber.replace(/[^0-9]/g, '');
        const isOwner = sender.includes(ownerNum) || m.key.fromMe;
        const isAdmin = admins.includes(sender);

        if (!isOwner && !isAdmin) {
            return await sock.sendMessage(chatJid, { 
                text: "🚫 *Access Denied:* Only the **Owner** or **Group Admins** can use this command!" 
            }, { quoted: m });
        }

        // 3. Identify the user to kick (Supports reply, mention, or argument)
        const contextInfo = m.message?.extendedTextMessage?.contextInfo || m.msg?.contextInfo;
        const userToKick = contextInfo?.participant || 
                           contextInfo?.mentionedJid?.[0] || 
                           (args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null);

        if (!userToKick) {
            return await sock.sendMessage(chatJid, { 
                text: `╭━━━〔 *INVALID USAGE* 〕━━━⬣\n┃ ❓ Please reply to a message,\n┃ tag a user, or provide a number.\n┃ 📌 *Example:* \`.k @user\`\n╰━━━━━━━━━━━━━━━━━━━━⬣` 
            }, { quoted: m });
        }

        // 4. Execute the removal
        await sock.groupParticipantsUpdate(chatJid, [userToKick], "remove");

        // 5. Modern styled success message
        const response = `╭━━━〔 *USER REMOVED* 〕━━━⬣
┃ 👤 *Target:* @${userToKick.split('@')[0]}
┃ 👮 *Authorized by:* @${sender.split('@')[0]}
╰━━━━━━━━━━━━━━━━━━━━⬣`.trim();

        await sock.sendMessage(chatJid, { 
            text: response, 
            mentions: [userToKick, sender] 
        }, { quoted: m });

        // 6. Auto-delete the command message (.k) to keep the chat clean
        await sock.sendMessage(chatJid, { delete: m.key }).catch(() => {});

    } catch (err) {
        console.error("Kick Command Error:", err);
        await sock.sendMessage(chatJid, { 
            text: "⚠️ *Error:* Make sure I am a **Group Admin** and have permission to remove members!" 
        }, { quoted: m });
    }
};
