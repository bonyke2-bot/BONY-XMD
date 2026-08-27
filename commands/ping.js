module.exports = async (sock, m) => {
    const { remoteJid } = m.key;

    // 1. Calculate actual latency precisely
    const start = Date.now();
    await sock.sendMessage(remoteJid, { react: { text: "⚡", key: m.key } });
    const ping = Date.now() - start;

    // 2. Modern Cyberpunk / Tech Design Template
    const pingMessage = `╭━━━〔 *SPEED TEST* 〕━━━⬣
┃ 🏓 *Pong:* \`${ping}ms\`
┃ 📡 *Status:* \`Online & Stable\`
┃ ⚡ *Response:* \`Super Fast\`
╰━━━━━━━━━━━━━━━━━━━━⬣

> *Everything is running smoothly!* 💜`.trim();

    // 3. Send message with rich card preview
    await sock.sendMessage(remoteJid, { 
        text: pingMessage,
        contextInfo: {
            forwardingScore: 999,
            isForwarded: true,
            externalAdReply: {
                title: "RIFT-MD PERFORMANCE 🚀",
                body: `Current Latency: ${ping}ms`,
                thumbnailUrl: "module.exports = async (sock, m) => {
    const { remoteJid } = m.key;

    // 1. Calculate actual latency precisely
    const start = Date.now();
    await sock.sendMessage(remoteJid, { react: { text: "⚡", key: m.key } });
    const ping = Date.now() - start;

    // 2. Modern Cyberpunk / Tech Design Template
    const pingMessage = `╭━━━〔 *SPEED TEST* 〕━━━⬣
┃ 🏓 *Pong:* \`${ping}ms\`
┃ 📡 *Status:* \`Online & Stable\`
┃ ⚡ *Response:* \`Super Fast\`
╰━━━━━━━━━━━━━━━━━━━━⬣

> *Everything is running smoothly!* 💜`.trim();

    // 3. Send message with rich card preview
    await sock.sendMessage(remoteJid, { 
        text: pingMessage,
        contextInfo: {
            forwardingScore: 999,
            isForwarded: true,
            externalAdReply: {
                title: "RIFT-MD PERFORMANCE 🚀",
                body: `Current Latency: ${ping}ms`,
                thumbnailUrl: "https://files.catbox.moe/zdk50s.jpg", 
                sourceUrl: "https://whatsapp.com/channel/0029Vb2J9C91dAw7vxA75y2V",
                mediaType: 1,
                renderLargerThumbnail: true
            }
        }
    }, { quoted: m });
};
", 
                sourceUrl: "https://whatsapp.com/channel/0029Vb2J9C91dAw7vxA75y2V",
                mediaType: 1,
                renderLargerThumbnail: true
            }
        }
    }, { quoted: m });
};
