const settings = require("../settings");

module.exports = async (sock, m, { text }) => {
    const prefix = settings.prefix || ".";

    let repoInfo = `
*╭──〔 REPOSITORY INFO 〕──⊷*
*├ 🤖 Bot Name:* QUEEN COLAMBIA
*├ 👑 Owner:* Weed Tech
*├ 📦 GitHub:* https://github.com/TECHGOAT333/QUEEN-COLOMBIA
*╰──────────────────────⊷*

> *©️ ᴘᴏᴡᴇʀᴇᴅ ʙʏ WEED TECH*
    `.trim();

    await sock.sendMessage(m.key.remoteJid, {
        text: repoInfo,
        contextInfo: {
            externalAdReply: {
                title: "QUEEN COLAMBIA REPO",
                body: "Click here to view source code",
                thumbnailUrl: "https://files.catbox.moe/3dwe96.jpg",
                sourceUrl: "https://github.com/TECHGOAT333/QUEEN-COLOMBIA",
                mediaType: 1,
                renderLargerThumbnail: true
            }
        }
    }, { quoted: m });
};