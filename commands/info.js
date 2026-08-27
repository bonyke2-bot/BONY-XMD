module.exports = async (sock, m) => {
    const chatId = m.key.remoteJid;

    // Bèl fòma bwat pou enfòmasyon bot la
    const info = `╭━━━〔 *BOT INFORMATION* 〕━━━⡱
┃ 🤖 *Name:* RIFT-MD
┃ 📊 *Version:* 2.0.0
┃ 💻 *Library:* Baileys (Node.js)
┃ 👤 *Developer:* WeedDev
╰━━━━━━━━━━━━━━━━━━━━⬣

> _© 2026 RIFT-MD MULTI-DEVICE_`.trim();

    // Voye mesaj la epi site moun ki te fè kòmand lan
    await sock.sendMessage(
        chatId,
        { text: info },
        { quoted: m }
    );
};
