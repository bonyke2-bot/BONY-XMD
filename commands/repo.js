module.exports = async (sock, m, args) => {
    const repoText = `╭━━━〔 🤖 *RIFT-MD REPOSITORY* 〕━━━⬣
┃ 🤖 *Bot Name:* RIFT-MD
┃ 👑 *Owner:* WeedDev
┃ 📦 *GitHub:* https://github.com/WeedTech/RIFT-MD
╰━━━━━━━━━━━━━━━━━━━━⬣`;

    const channelInfo = {
        contextInfo: {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363407561123100@newsletter',
                newsletterName: 'RIFT-MD',
                serverMessageId: -1
            }
        }
    };

    await sock.sendMessage(m.key.remoteJid, {
        image: { url: "https://files.catbox.moe/k9we12.png" },
        caption: repoText,
        ...channelInfo
    }, { quoted: m });
};
