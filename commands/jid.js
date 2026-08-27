module.exports = async (sock, m) => {

    // JID konvèsasyon an (Group oswa Chat prive)
    const chatJid = m.key.remoteJid;
    
    // JID moun ki voye mesaj la (Sender)
    const senderJid = m.sender || m.key.participant || m.key.remoteJid;

    const responseText = `
*╭───〔 🆔 JID INFO 〕───⭐*
│
│ 👤 *Sender:* ${senderJid}
│ 💬 *Chat:* ${chatJid}
│
*╰──────────────⭐*
    `.trim();

    await sock.sendMessage(chatJid, { 
        text: responseText 
    }, { quoted: m });

}
