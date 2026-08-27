module.exports = async (sock, m, args) => {
    const from = m.key.remoteJid;
    const url = args[0];

    if (!url || !url.includes('instagram.com')) {
        return sock.sendMessage(from, { 
            text: "亗 *QUEEN COLAMBIA* 亗\n\n❌ *Error:* Please provide a valid Instagram link.\n💡 *Usage:* .ig [link]" 
        }, { quoted: m });
    }

    await sock.sendMessage(from, { react: { text: "⏳", key: m.key } });

    try {
        const response = await fetch(`https://api.vreden.my.id/api/igdl?url=${encodeURIComponent(url)}`);
        const res = await response.json();

        if (res.result && res.result[0]) {
            const caption = 
                `┏━━━━━━━━━━━━━━━━━━┓\n` +
                `┃   📸  *INSTAGRAM DOWNLOAD* \n` +
                `┠━━━━━━━━━━━━━━━━━━┫\n` +
                `┃ ✅ *Status:* Success\n` +
                `┃ 👑 *Bot:* QUEEN COLAMBIA\n` +
                `┗━━━━━━━━━━━━━━━━━━┛`;

            await sock.sendMessage(from, { 
                video: { url: res.result[0].url }, 
                caption: caption 
            }, { quoted: m });

            await sock.sendMessage(from, { react: { text: "✅", key: m.key } });
        } else {
            throw new Error();
        }
    } catch (e) {
        await sock.sendMessage(from, { react: { text: "❌", key: m.key } });
        await sock.sendMessage(from, { text: "❌ *Error:* Failed to download. The link might be private." });
    }
};
