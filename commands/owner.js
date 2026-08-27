module.exports = async (sock, m) => {
    const chatId = m.key.remoteJid;
    
    // Developer configuration details
    const ownerNumber = "50948247470"; 
    const devName = "WeedDev"; 
    const ownerJid = ownerNumber + '@s.whatsapp.net';

    // 1. Create the VCard (Contact Card) format
    const vcard = 'BEGIN:VCARD\n'
        + 'VERSION:3.0\n' 
        + `FN:${devName}\n` 
        + `ORG:RIFT-MD Bot Developer;\n`
        + `TEL;type=CELL;type=VOICE;waid=${ownerNumber}:+${ownerNumber}\n`
        + 'END:VCARD';

    try {
        // Reaction 👑
        await sock.sendMessage(chatId, { react: { text: "👑", key: m.key } });

        // 2. Send the Contact Card (VCard)
        await sock.sendMessage(
            chatId,
            { 
                contacts: { 
                    displayName: devName, 
                    contacts: [{ vcard }] 
                }
            },
            { quoted: m }
        );

        // 3. Professional Information Message with sleek box style
        const ownerMessage = `╭━━━〔 *RIFT-MD DEVELOPER* 〕━━━⡱
┃ 👤 *Name:* ${devName}
┃ 📱 *WhatsApp:* wa.me/${ownerNumber}
┃ 🤖 *Bot:* RIFT-MD
╰━━━━━━━━━━━━━━━━━━━━⬣

_💡 Tap the contact card above to save or message directly._`.trim();

        await sock.sendMessage(chatId, { 
            text: ownerMessage,
            contextInfo: {
                mentionedJid: [ownerJid],
                forwardingScore: 999,
                isForwarded: true
            }
        }, { quoted: m });

        await sock.sendMessage(chatId, { react: { text: "✅", key: m.key } });

    } catch (error) {
        console.error("Owner Command Error:", error);
        await sock.sendMessage(chatId, { react: { text: "❌", key: m.key } });
        await sock.sendMessage(chatId, { text: "❌ *Error:* Failed to display developer contact." }, { quoted: m });
    }
};
