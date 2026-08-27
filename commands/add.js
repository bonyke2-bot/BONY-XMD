module.exports = async (sock, m) => {
    const { remoteJid, participant } = m.key;

    // 1. Tcheke si se nan yon gwoup ou ye
    if (!remoteJid.endsWith('@g.us')) {
        return await sock.sendMessage(remoteJid, { text: "❌ This command can only be used in groups." }, { quoted: m });
    }

    // 2. Jwenn nimewo moun nan (swa nan reply, swa nan tèks la)
    let text = m.message.conversation || m.message.extendedTextMessage?.text || "";
    let users = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || 
                (m.message.extendedTextMessage?.contextInfo?.participant) || 
                text.split(' ')[1];

    if (!users) {
        return await sock.sendMessage(remoteJid, { text: "❓ Please provide a number or reply to a message to add someone." }, { quoted: m });
    }

    // Retire karaktè ki pa chif si se yon nimewo yo tape
    let userToAdd = users.replace(/[^0-9]/g, '') + '@s.whatsapp.net';

    try {
        // 3. Egzekite aksyon pou ajoute moun nan
        await sock.groupParticipantsUpdate(remoteJid, [userToAdd], "add");

        await sock.sendMessage(remoteJid, { 
            text: `✅ *QUEEN COLAMBIA ACTION*\n\nUser successfully added to the group.` 
        }, { quoted: m });

    } catch (err) {
        await sock.sendMessage(remoteJid, { 
            text: "⚠️ *ERROR:* Make sure I am an **Admin** and the number is correct." 
        }, { quoted: m });
        console.log(err);
    }
}
