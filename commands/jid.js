module.exports = async (sock, m, args) => {
    const chatJid = m.key.remoteJid;
    const senderJid = m.sender || m.key.participant || m.key.remoteJid;
    
    // Get the input text or link provided after the command
    const inputArg = args ? args.join(" ") : "";
    let extractedJid = "";

    if (inputArg) {
        // Check if the user pasted a WhatsApp channel link or text containing a JID
        const match = inputArg.match(/([0-9]+@newsletter)/);
        if (match) {
            extractedJid = match[1];
        } else {
            extractedJid = inputArg.trim(); // If a direct JID was provided
        }
    }

    const targetJid = extractedJid || chatJid;

    const responseText = `╭━━━〔 *JID INFO & EXTRACTOR* 〕━━━⬣
┃ 👤 *Sender:* ${senderJid}
┃ 💬 *Current Chat:* ${chatJid}
┃ 🔗 *Extracted JID:* ${targetJid}
┃ 🤖 *Bot:* RIFT-MD 
╰━━━━━━━━━━━━━━━━━━━━⬣`.trim();

    await sock.sendMessage(chatJid, { 
        text: responseText 
    }, { quoted: m });
};
