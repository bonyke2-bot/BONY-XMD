module.exports = async (sock, m, args) => {
    const repoText = `╭━━━〔 🤖 *BONY-XMD REPOSITORY* 〕━━━⬣
┃ 🤖 *Bot Name:* BONY-XMD
┃ 👑 *Owner:* BONY KE
┃ 📦 *GitHub:* https://github.com/bonyke2-bot/BONY-XMD
╰━━━━━━━━━━━━━━━━━━━━⬣`;

    const channelInfo = {
        contextInfo: {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '0029Vb8coEnKAwEcRBDDnq0Z@newsletter',
                newsletterName: 'BONY-XMD',
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
