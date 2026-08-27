const settings = require("../settings");

module.exports = async (sock, m, { text }) => {
    const chatId = m.key.remoteJid;
    const prefix = settings.prefix || ".";

    let repoInfo = `╭━━━〔 *RIFT-MD REPOSITORY* 〕━━━⡱
┃ 🤖 *Bot Name:* RIFT-MD
┃ 👑 *Owner:* WeedDev
┃ 📦 *GitHub:* https://github.com/TECHGOAT333/QUEEN-COLOMBIA
╰━━━━━━━━━━━━━━━━━━━━⬣

> _©️ Powered by RIFT-MD MULTI-DEVICE_`.trim();

    await sock.sendMessage(chatId, {
        text: repoInfo,
        contextInfo: {
            externalAdReply: {
                title: "RIFT-MD OFFICIAL REPO",
                body: "Click here to view the source code",
                thumbnailUrl: "https://files.catbox.moe/vv674d.jpg",
                sourceUrl: "https://github.com/WeedTech/---",
                mediaType: 1,
                renderLargerThumbnail: true
            }
        }
    }, { quoted: m });
};
