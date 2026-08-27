module.exports = async (sock, m) => {
    const { remoteJid } = m.key;

    // 1. Safe extraction of quoted message info (Modern Baileys compatible)
    const contextInfo = m.message?.extendedTextMessage?.contextInfo || m.msg?.contextInfo;
    
    if (!contextInfo || !contextInfo.stanzaId) {
        return await sock.sendMessage(remoteJid, { 
            text: "❓ *Error:* Please reply to the message you want me to delete." 
        }, { quoted: m });
    }

    try {
        // 2. Prepare the key for the quoted message
        const targetKey = {
            remoteJid: remoteJid,
            fromMe: contextInfo.participant?.includes(sock.user.id.split(':')[0]) || false,
            id: contextInfo.stanzaId,
            participant: contextInfo.participant
        };

        // 3. Delete BOTH the target message and the command message smoothly
        await sock.sendMessage(remoteJid, { delete: targetKey }); // Efase mesaj ou reponn nan
        await sock.sendMessage(remoteJid, { delete: m.key });      // Efase komand la (.delete)

    } catch (err) {
        console.error("Delete Command Error:", err);
        
        // Modern styled error response
        const errorText = `╭━━━〔 *DELETE ERROR* 〕━━━⬣
┃ ⚠️ *Failed to delete message!*
┃ Make sure I am a **Group Admin** 
┃ if you want to delete others' messages.
╰━━━━━━━━━━━━━━━━━━━━⬣`.trim();

        await sock.sendMessage(remoteJid, { text: errorText }, { quoted: m });
    }
};
