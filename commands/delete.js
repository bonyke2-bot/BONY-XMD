module.exports = async (sock, m) => {
    const { remoteJid } = m.key;

    // 1. Check if there is a quoted message (reply)
    const quoted = m.message?.extendedTextMessage?.contextInfo;
    
    if (!quoted || !quoted.stanzaId) {
        return await sock.sendMessage(remoteJid, { 
            text: "❓ *Error:* Please reply to the message you want me to delete." 
        }, { quoted: m });
    }

    try {
        // 2. Prepare the deletion key
        const keyToDelete = {
            remoteJid: remoteJid,
            // Check if the message was sent by the bot itself
            fromMe: quoted.participant === (sock.user.id.split(':')[0] + '@s.whatsapp.net'), 
            id: quoted.stanzaId,
            participant: quoted.participant // Crucial for group message identification
        };

        // 3. Execute "Delete for Everyone"
        await sock.sendMessage(remoteJid, { delete: keyToDelete });

    } catch (err) {
        console.error("Delete Command Error:", err);
        // This error usually triggers if the bot is not a Group Admin
        await sock.sendMessage(remoteJid, { 
            text: "⚠️ *Permission Denied:* I need to be a **Group Admin** to delete messages from other members." 
        }, { quoted: m });
    }
}
