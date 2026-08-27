module.exports = async (sock, m) => {
    const { remoteJid } = m.key;

    // 1. Precise Latency Calculation (Ping)
    const start = Date.now();
    await sock.sendMessage(remoteJid, { react: { text: "⚡", key: m.key } });
    const latency = Date.now() - start;

    // 2. Modern Cyber/Tech Design Template
    const aliveTemplate = `╭━━━〔 *RIFT-MD* 〕━━━⬣
┃ 🚀 *Ping:* \`${latency}ms\`
┃ 🛰️ *Status:* \`Online & Stable\`
┃ ⚙️ *Version:* \`2.0.0\`
┃ 💎 *Platform:* \`Pterodactyl / Cloud\`
╰━━━━━━━━━━━━━━━━━━━━⬣

> *Rift Md is fully operational and ready to serve.* 💜`.trim();

    // 3. Send Message with Rich Preview Card
    await sock.sendMessage(remoteJid, { 
        text: aliveTemplate,
        contextInfo: {
            mentionedJid: [m.sender],
            forwardingScore: 999,
            isForwarded: true,
            externalAdReply: {
                title: "RIFT-MD 👑",
                body: "Tap to join official channel",
                thumbnailUrl: "https://files.catbox.moe/yg3xc1.png",
                sourceUrl: "https://whatsapp.com/channel/0029Vb2J9C91dAw7vxA75y2V",
                mediaType: 1,
                renderLargerThumbnail: true
            }
        }
    }, { quoted: m });

    // 4. Send Voice Note (PTT) smoothly
    await sock.sendMessage(remoteJid, { 
        audio: { url: "https://files.catbox.moe/pframr.mp3" }, 
        mimetype: 'audio/mp4', 
        ptt: true 
    }, { quoted: m });
};
