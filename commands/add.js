module.exports = async (sock, m, args) => {
    const remoteJid = m.key.remoteJid;

    // 1. Check if it's a group
    if (!remoteJid.endsWith('@g.us')) {
        return await sock.sendMessage(remoteJid, { text: "❌ *Error:* This command can only be used in groups." }, { quoted: m });
    }

    // 2. Get user from mention, reply, or raw text number
    let mentioned = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    let participant = m.message.extendedTextMessage?.contextInfo?.participant;
    let rawText = args[0] ? args[0].replace(/[^0-9]/g, '') : '';

    let targetUser = mentioned || participant || (rawText ? rawText + '@s.whatsapp.net' : null);

    if (!targetUser) {
        return await sock.sendMessage(remoteJid, { 
            text: "👑 *RIFT-MD - ADD COMMAND*\n\n❌ *Please tag (@) a user, reply to their message, or provide a valid phone number!*" 
        }, { quoted: m });
    }

    try {
        // 3. Verify if the number is actually on WhatsApp (makes it super solid)
        const [result] = await sock.onWhatsApp(targetUser.split('@')[0]);
        if (!result || !result.exists) {
            return await sock.sendMessage(remoteJid, { text: "❌ *Error:* This phone number is not registered on WhatsApp." }, { quoted: m });
        }

        const validJid = result.jid;

        // 4. Update group participants (Add)
        await sock.groupParticipantsUpdate(remoteJid, [validJid], "add");

        const responseText = `╭━━━〔 *RIFT-MD ADMIN* 〕━━━⡱
┃ 👤 *User:* @${validJid.split('@')[0]}
┃ 📈 *Action:* Added to group successfully ✅
┃ 🤖 *Bot:* RIFT-MD
╰━━━━━━━━━━━━━━━━━━━━⬣`;

        await sock.sendMessage(remoteJid, { 
            text: responseText, 
            mentions: [validJid] 
        }, { quoted: m });

    } catch (err) {
        console.error("Add Command Error:", err);
        await sock.sendMessage(remoteJid, { 
            text: "⚠️ *Critical Error:* Make sure I am an **Admin** in this group, and check if the user's privacy settings allow being added directly." 
        }, { quoted: m });
    }
};
