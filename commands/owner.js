module.exports = async (sock, m) => {
    // WeedDev direct contact info
    const ownerNumber = "50942823248"; 
    const devName = "WeedDev"; 

    // 1. Create the VCard (Contact Card) format
    const vcard = 'BEGIN:VCARD\n'
        + 'VERSION:3.0\n' 
        + `FN:${devName}\n` 
        + `ORG:Queen Colambia Bot Developer;\n`
        + `TEL;type=CELL;type=VOICE;waid=${ownerNumber}:+${ownerNumber}\n`
        + 'END:VCARD';

    // 2. Send the Contact Card (VCard)
    await sock.sendMessage(
        m.key.remoteJid,
        { 
            contacts: { 
                displayName: devName, 
                contacts: [{ vcard }] 
            }
        },
        { quoted: m }
    );

    // 3. Professional Information Message
    const ownerMessage = `
*╭───〔 👑 OWNER INFO 〕───⭐*
│
│ 👤 *Developer:* ${devName}
│ 📱 *WhatsApp:* wa.me/${ownerNumber}
│ 🤖 *Bot:* QUEEN COLAMBIA
│
*╰──────────────⭐*

_Click the card above to save my contact, or use the link to message me directly._
    `.trim();

    await sock.sendMessage(m.key.remoteJid, { 
        text: ownerMessage,
        contextInfo: {
            mentionedJid: [ownerNumber + '@s.whatsapp.net']
        }
    }, { quoted: m });
}
