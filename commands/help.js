module.exports = async (sock, m) => {
    const { remoteJid, sender } = m.key;

    // 1. Modern text with a box-style aesthetic and symbols
    const message = `╭━━━〔 *COMMAND NOT FOUND* 〕━━━⬣
┃ *Hello @${sender.split('@')[0]}!* 👋
┃ 
┃ ⚠️ I couldn't recognize that command.
┃ Please check the available features below:
┃
┃ 📜 *Command:* \`.menu\`
┃ 🤖 *Bot:* \`RIFT-MD\`
╰━━━━━━━━━━━━━━━━━━━━⬣

> _Reply with *\.menu* to explore all my features._ 💜`.trim();

    // 2. Send the message with a rich, large preview card
    await sock.sendMessage(remoteJid, {
        text: message,
        mentions: [sender], // This tags the user automatically (@phone)
        contextInfo: {
            forwardingScore: 999, // Gives it an "Official / Forwarded" look
            isForwarded: true,
            externalAdReply: {
                title: "👑 RIFT-MD HELP CENTER 👑",
                body: "Tap here to explore the command list",
                thumbnailUrl: "https://files.catbox.moe/vv674d.jpg",
                sourceUrl: "https://whatsapp.com/channel/0029Vb2J9C91dAw7vxA75y2V",
                mediaType: 1,
                renderLargerThumbnail: true // Makes the image appear large
            }
        }
    }, { quoted: m });
};
