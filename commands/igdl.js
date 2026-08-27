const axios = require('axios');

module.exports = async (sock, m, args) => {
    const chatId = m.key.remoteJid;
    const body = m.message?.conversation || m.message?.extendedTextMessage?.text || "";
    const prefix = body.charAt(0);
    const command = body.slice(prefix.length).trim().split(/ +/)[0].toLowerCase();

    if (command !== 'ig' && command !== 'instagram' && command !== 'igdl') return;

    const url = args[0];

    if (!url || !url.includes('instagram.com')) {
        return await sock.sendMessage(chatId, { text: `❌ Please provide a valid Instagram link!\n💡 Example: \`${prefix}${command} https://www.instagram.com/...\`` }, { quoted: m });
    }

    try {
        await sock.sendMessage(chatId, { react: { text: "⏳", key: m.key } });

        const apiUrl = `https://api.vreden.my.id/api/igdl?url=${encodeURIComponent(url)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.result || data.result.length === 0) {
            throw new Error('No media found.');
        }

        const mediaUrl = data.result[0].url;

        await sock.sendMessage(chatId, {
            video: { url: mediaUrl },
            caption: "🎬 *Downloaded by RIFT-MD*"
        }, { quoted: m });

        await sock.sendMessage(chatId, { react: { text: "✅", key: m.key } });

    } catch (error) {
        console.error(error);
        await sock.sendMessage(chatId, { react: { text: "❌", key: m.key } });
        await sock.sendMessage(chatId, { text: "❌ Failed to download Instagram video." }, { quoted: m });
    }
};
